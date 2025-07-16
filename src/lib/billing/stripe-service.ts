import Stripe from 'stripe';
import DatabaseManager from '../database/manager';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    max_users: number;
    max_conversations_per_month: number;
    max_file_size_mb: number;
    storage_limit_gb: number;
  };
}

export interface CreateSubscriptionRequest {
  tenant_id: string;
  plan_id: string;
  payment_method_id: string;
  billing_interval: 'monthly' | 'yearly';
}

export class StripeService {
  private stripe: Stripe;
  private db: DatabaseManager;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
    });
    this.db = DatabaseManager.getInstance();
  }

  // Plan definitions
  private plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price_monthly: 0,
      price_yearly: 0,
      features: ['Basic AI Chat', 'File Upload', 'Conversation History'],
      limits: {
        max_users: 5,
        max_conversations_per_month: 100,
        max_file_size_mb: 10,
        storage_limit_gb: 1,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      price_monthly: 29,
      price_yearly: 290,
      features: [
        'Everything in Free',
        'Advanced Analytics',
        'Custom Models',
        'Priority Support',
        'Up to 50 Users',
      ],
      limits: {
        max_users: 50,
        max_conversations_per_month: 10000,
        max_file_size_mb: 100,
        storage_limit_gb: 50,
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price_monthly: 99,
      price_yearly: 990,
      features: [
        'Everything in Pro',
        'SSO Integration',
        'Advanced Security',
        'Custom Branding',
        'Unlimited Users',
        'Dedicated Support',
      ],
      limits: {
        max_users: -1,
        max_conversations_per_month: -1,
        max_file_size_mb: 1000,
        storage_limit_gb: 1000,
      },
    },
  ];

  async createCustomer(tenant_id: string, email: string, name: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          tenant_id,
        },
      });

      // Store customer ID in database
      this.db.prepare(`
        UPDATE tenants SET stripe_customer_id = ? WHERE id = ?
      `).run(customer.id, tenant_id);

      return customer.id;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<any> {
    try {
      const plan = this.plans.find(p => p.id === request.plan_id);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      if (plan.id === 'free') {
        // Handle free plan (no Stripe subscription needed)
        return this.createFreeSubscription(request.tenant_id);
      }

      // Get or create customer
      let customerId = await this.getCustomerId(request.tenant_id);
      if (!customerId) {
        const tenant = this.db.prepare('SELECT * FROM tenants WHERE id = ?').get(request.tenant_id) as any;
        customerId = await this.createCustomer(request.tenant_id, 'admin@tenant.com', tenant.name);
      }

      // Create price if it doesn't exist
      const priceId = await this.getOrCreatePrice(plan, request.billing_interval);

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: request.payment_method_id,
        metadata: {
          tenant_id: request.tenant_id,
          plan_id: request.plan_id,
        },
      });

      // Update database
      await this.updateSubscriptionInDatabase(subscription, request.tenant_id);

      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  private async createFreeSubscription(tenant_id: string): Promise<any> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO billing_subscriptions (
          id, tenant_id, plan_name, status, stripe_subscription_id,
          current_period_start, current_period_end,
          created_at, updated_at
        )
        VALUES (?, ?, 'free', 'active', NULL, date('now'), date('now', '+1 year'), datetime('now'), datetime('now'))
      `);

      const subscriptionId = `free_${tenant_id}`;
      stmt.run(subscriptionId, tenant_id);

      return {
        id: subscriptionId,
        status: 'active',
        plan: 'free',
      };
    } catch (error) {
      console.error('Failed to create free subscription:', error);
      throw error;
    }
  }

  private async getCustomerId(tenant_id: string): Promise<string | null> {
    try {
      const result = this.db.prepare(`
        SELECT stripe_customer_id FROM tenants WHERE id = ?
      `).get(tenant_id) as any;

      return result?.stripe_customer_id || null;
    } catch (error) {
      console.error('Failed to get customer ID:', error);
      return null;
    }
  }

  private async getOrCreatePrice(plan: SubscriptionPlan, interval: 'monthly' | 'yearly'): Promise<string> {
    const amount = interval === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const intervalCount = interval === 'yearly' ? 12 : 1;

    try {
      // In a real implementation, you'd store and reuse price IDs
      const price = await this.stripe.prices.create({
        unit_amount: amount * 100, // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
          interval_count: intervalCount,
        },
        product_data: {
          name: `${plan.name} Plan`,
          metadata: {
            plan_id: plan.id,
          },
        },
      });

      return price.id;
    } catch (error) {
      console.error('Failed to create price:', error);
      throw error;
    }
  }

  private async updateSubscriptionInDatabase(subscription: Stripe.Subscription, tenant_id: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO billing_subscriptions (
          id, tenant_id, plan_name, status, stripe_subscription_id,
          current_period_start, current_period_end,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      stmt.run(
        subscription.id,
        tenant_id,
        subscription.metadata.plan_id,
        subscription.status,
        subscription.id,
        new Date(subscription.current_period_start * 1000).toISOString(),
        new Date(subscription.current_period_end * 1000).toISOString()
      );
    } catch (error) {
      console.error('Failed to update subscription in database:', error);
      throw error;
    }
  }

  async cancelSubscription(tenant_id: string): Promise<void> {
    try {
      const subscription = this.db.prepare(`
        SELECT stripe_subscription_id FROM billing_subscriptions WHERE tenant_id = ?
      `).get(tenant_id) as any;

      if (subscription?.stripe_subscription_id) {
        await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      // Update database
      this.db.prepare(`
        UPDATE billing_subscriptions SET status = 'canceled', updated_at = datetime('now')
        WHERE tenant_id = ?
      `).run(tenant_id);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to handle webhook:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Update subscription status and period
    if (invoice.subscription) {
      this.db.prepare(`
        UPDATE billing_subscriptions 
        SET status = 'active', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `).run(invoice.subscription);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Handle failed payment
    if (invoice.subscription) {
      this.db.prepare(`
        UPDATE billing_subscriptions 
        SET status = 'past_due', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `).run(invoice.subscription);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await this.updateSubscriptionInDatabase(subscription, subscription.metadata.tenant_id);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.db.prepare(`
      UPDATE billing_subscriptions 
      SET status = 'canceled', updated_at = datetime('now')
      WHERE stripe_subscription_id = ?
    `).run(subscription.id);
  }

  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.find(p => p.id === planId);
  }
}

// Default instance (will be configured from environment)
let stripeService: StripeService | null = null;

export function getStripeService(): StripeService | null {
  if (!stripeService && process.env.STRIPE_SECRET_KEY) {
    stripeService = new StripeService(process.env.STRIPE_SECRET_KEY);
  }
  return stripeService;
}

export { stripeService };
