import { AgentConfig } from '@/lib/agents/MultiAgentManager';

/**
 * Specialized Agent Definitions for Enhanced Development Tasks
 * These agents provide focused expertise for specific domains
 */

export const SpecializedAgents: AgentConfig[] = [
  {
    id: 'code_reviewer_advanced',
    name: 'AdvancedCodeReviewer',
    role: 'Senior Code Review Specialist',
    specialization: 'comprehensive_code_analysis',
    traits: [
      'detail-oriented',
      'security-conscious', 
      'performance-focused',
      'best-practices-advocate',
      'mentoring'
    ],
    capabilities: [
      'static_code_analysis',
      'security_vulnerability_detection',
      'performance_optimization_suggestions',
      'code_quality_assessment',
      'architectural_review',
      'documentation_review',
      'test_coverage_analysis',
      'dependency_security_audit'
    ],
    model: 'gemma3:latest',
    temperature: 0.2,
    enabled: true
  },
  
  {
    id: 'research_agent',
    name: 'ResearchSpecialist',
    role: 'Information Gathering & Analysis Expert',
    specialization: 'comprehensive_research',
    traits: [
      'thorough',
      'analytical',
      'objective',
      'curious',
      'methodical'
    ],
    capabilities: [
      'information_synthesis',
      'trend_analysis',
      'competitive_analysis',
      'technology_evaluation',
      'market_research',
      'academic_research',
      'fact_verification',
      'source_credibility_assessment'
    ],
    model: 'gemma3:latest',
    temperature: 0.3,
    enabled: true
  },

  {
    id: 'planning_agent',
    name: 'ProjectPlanningExpert',
    role: 'Strategic Planning & Project Management Specialist',
    specialization: 'project_management',
    traits: [
      'strategic',
      'organized',
      'realistic',
      'goal-oriented',
      'risk-aware'
    ],
    capabilities: [
      'project_planning',
      'milestone_definition',
      'resource_allocation',
      'risk_assessment',
      'timeline_estimation',
      'stakeholder_analysis',
      'scope_management',
      'progress_tracking'
    ],
    model: 'gemma3:latest',
    temperature: 0.2,
    enabled: true
  },

  {
    id: 'quality_assurance_agent',
    name: 'QualityAssuranceExpert',
    role: 'Quality Assurance & Testing Specialist',
    specialization: 'quality_assurance',
    traits: [
      'meticulous',
      'systematic',
      'critical-thinking',
      'user-focused',
      'process-oriented'
    ],
    capabilities: [
      'test_strategy_development',
      'test_case_design',
      'automation_recommendations',
      'bug_reproduction',
      'user_experience_testing',
      'performance_testing',
      'accessibility_testing',
      'regression_testing_strategy'
    ],
    model: 'gemma3:latest',
    temperature: 0.2,
    enabled: true
  },

  {
    id: 'architecture_agent',
    name: 'SoftwareArchitect',
    role: 'Software Architecture & Design Specialist',
    specialization: 'software_architecture',
    traits: [
      'visionary',
      'systematic',
      'scalability-focused',
      'technology-aware',
      'standards-compliant'
    ],
    capabilities: [
      'system_design',
      'architectural_patterns',
      'scalability_planning',
      'technology_selection',
      'integration_design',
      'security_architecture',
      'performance_architecture',
      'documentation_creation'
    ],
    model: 'gemma3:latest',
    temperature: 0.3,
    enabled: true
  },

  {
    id: 'ui_ux_agent',
    name: 'UIUXDesigner',
    role: 'User Interface & Experience Design Specialist',
    specialization: 'ui_ux_design',
    traits: [
      'user-empathetic',
      'aesthetic',
      'intuitive',
      'accessibility-aware',
      'data-driven'
    ],
    capabilities: [
      'user_journey_mapping',
      'interface_design',
      'usability_analysis',
      'accessibility_compliance',
      'responsive_design',
      'interaction_design',
      'user_testing_strategy',
      'design_system_creation'
    ],
    model: 'gemma3:latest',
    temperature: 0.4,
    enabled: true
  },

  {
    id: 'security_agent',
    name: 'SecuritySpecialist',
    role: 'Cybersecurity & Security Analysis Expert',
    specialization: 'security_analysis',
    traits: [
      'security-paranoid',
      'threat-aware',
      'compliance-focused',
      'proactive',
      'risk-conscious'
    ],
    capabilities: [
      'vulnerability_assessment',
      'threat_modeling',
      'security_code_review',
      'penetration_testing_guidance',
      'compliance_analysis',
      'incident_response_planning',
      'security_architecture_review',
      'privacy_impact_assessment'
    ],
    model: 'gemma3:latest',
    temperature: 0.1,
    enabled: true
  },

  {
    id: 'data_scientist_agent',
    name: 'DataScientist',
    role: 'Data Science & Analytics Specialist',
    specialization: 'data_science',
    traits: [
      'analytical',
      'statistical',
      'pattern-seeking',
      'hypothesis-driven',
      'visualization-focused'
    ],
    capabilities: [
      'data_analysis',
      'statistical_modeling',
      'machine_learning',
      'data_visualization',
      'predictive_analytics',
      'a_b_testing',
      'feature_engineering',
      'model_validation'
    ],
    model: 'gemma3:latest',
    temperature: 0.2,
    enabled: true
  },

  {
    id: 'devops_agent',
    name: 'DevOpsEngineer',
    role: 'DevOps & Infrastructure Specialist',
    specialization: 'devops_infrastructure',
    traits: [
      'automation-focused',
      'reliability-oriented',
      'scalability-minded',
      'monitoring-aware',
      'efficiency-driven'
    ],
    capabilities: [
      'ci_cd_pipeline_design',
      'infrastructure_automation',
      'containerization',
      'monitoring_setup',
      'deployment_strategies',
      'scaling_solutions',
      'disaster_recovery',
      'performance_optimization'
    ],
    model: 'gemma3:latest',
    temperature: 0.2,
    enabled: true
  },

  {
    id: 'technical_writer_agent',
    name: 'TechnicalWriter',
    role: 'Technical Documentation Specialist',
    specialization: 'technical_documentation',
    traits: [
      'clarity-focused',
      'detail-oriented',
      'user-centric',
      'structured',
      'comprehensive'
    ],
    capabilities: [
      'api_documentation',
      'user_guides',
      'technical_specifications',
      'code_documentation',
      'process_documentation',
      'training_materials',
      'knowledge_base_creation',
      'documentation_standards'
    ],
    model: 'gemma3:latest',
    temperature: 0.3,
    enabled: true
  }
];

/**
 * Advanced workflows using specialized agents
 */
export const SpecializedWorkflows = [
  {
    id: 'comprehensive_development_review',
    name: 'Comprehensive Development Review',
    description: 'Full-stack development review including code, security, UX, and documentation',
    steps: [
      {
        id: 'initial_code_review',
        type: 'parallel' as const,
        agents: ['code_reviewer_advanced', 'security_agent']
      },
      {
        id: 'architecture_review',
        type: 'sequential' as const,
        agents: ['architecture_agent']
      },
      {
        id: 'ux_and_quality_review',
        type: 'parallel' as const,
        agents: ['ui_ux_agent', 'quality_assurance_agent']
      },
      {
        id: 'documentation_review',
        type: 'sequential' as const,
        agents: ['technical_writer_agent']
      },
      {
        id: 'deployment_review',
        type: 'sequential' as const,
        agents: ['devops_agent']
      }
    ],
    triggers: ['comprehensive_review', 'full_review', 'complete_analysis'],
    enabled: true
  },

  {
    id: 'research_and_planning_workflow',
    name: 'Research & Strategic Planning',
    description: 'Comprehensive research followed by strategic planning and architecture design',
    steps: [
      {
        id: 'initial_research',
        type: 'sequential' as const,
        agents: ['research_agent']
      },
      {
        id: 'planning_and_architecture',
        type: 'parallel' as const,
        agents: ['planning_agent', 'architecture_agent']
      },
      {
        id: 'implementation_strategy',
        type: 'sequential' as const,
        agents: ['devops_agent']
      }
    ],
    triggers: ['research_and_plan', 'strategic_planning', 'project_initiation'],
    enabled: true
  },

  {
    id: 'security_audit_workflow',
    name: 'Security Audit & Compliance Review',
    description: 'Comprehensive security review with code analysis and compliance checking',
    steps: [
      {
        id: 'security_code_review',
        type: 'parallel' as const,
        agents: ['security_agent', 'code_reviewer_advanced']
      },
      {
        id: 'architecture_security_review',
        type: 'sequential' as const,
        agents: ['architecture_agent']
      },
      {
        id: 'qa_security_testing',
        type: 'sequential' as const,
        agents: ['quality_assurance_agent']
      }
    ],
    triggers: ['security_audit', 'security_review', 'compliance_check'],
    enabled: true
  },

  {
    id: 'user_experience_optimization',
    name: 'User Experience Optimization',
    description: 'UX analysis with data-driven insights and quality assurance',
    steps: [
      {
        id: 'ux_analysis',
        type: 'sequential' as const,
        agents: ['ui_ux_agent']
      },
      {
        id: 'data_driven_insights',
        type: 'sequential' as const,
        agents: ['data_scientist_agent']
      },
      {
        id: 'quality_validation',
        type: 'sequential' as const,
        agents: ['quality_assurance_agent']
      }
    ],
    triggers: ['ux_optimization', 'user_experience', 'usability_review'],
    enabled: true
  }
];

/**
 * Agent capability matrix for smart agent selection
 */
export const AgentCapabilityMatrix = {
  'code_analysis': ['code_reviewer_advanced', 'security_agent', 'architecture_agent'],
  'security_review': ['security_agent', 'code_reviewer_advanced'],
  'project_planning': ['planning_agent', 'architecture_agent'],
  'quality_assurance': ['quality_assurance_agent', 'ui_ux_agent'],
  'research': ['research_agent', 'data_scientist_agent'],
  'documentation': ['technical_writer_agent', 'code_reviewer_advanced'],
  'user_experience': ['ui_ux_agent', 'data_scientist_agent'],
  'infrastructure': ['devops_agent', 'security_agent', 'architecture_agent'],
  'data_analysis': ['data_scientist_agent', 'research_agent'],
  'performance': ['devops_agent', 'code_reviewer_advanced', 'architecture_agent']
};

/**
 * Get recommended agents for a specific task type
 */
export function getRecommendedAgents(taskType: string): string[] {
  return AgentCapabilityMatrix[taskType as keyof typeof AgentCapabilityMatrix] || [];
}

/**
 * Get all available specializations
 */
export function getAvailableSpecializations(): string[] {
  return SpecializedAgents.map(agent => agent.specialization);
}

/**
 * Get agent by specialization
 */
export function getAgentBySpecialization(specialization: string): AgentConfig | undefined {
  return SpecializedAgents.find(agent => agent.specialization === specialization);
}
