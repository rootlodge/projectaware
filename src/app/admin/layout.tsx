import type { Metadata } from "next"
import Link from "next/link"
import { Users, LayoutDashboard, Settings, Activity } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Admin Portal - Project Aware",
  description: "Administrative controls for Project Aware",
}

function AdminSidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
           <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Admin Portal
          </h2>
          <div className="space-y-1">
             <Button asChild variant="secondary" className="w-full justify-start">
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Overview
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/admin/activity">
                <Activity className="mr-2 h-4 w-4" />
                System Activity
              </Link>
            </Button>
             <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurations
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
       <header className="sticky top-0 z-50 w-full border-b bg-destructive/10 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
           <div className="mr-4 hidden md:flex">
             <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block text-destructive">
                Project Aware Admin
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
             <div className="w-full flex-1 md:w-auto md:flex-none">
              
            </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard">Exit to App</Link>
                </Button>
                <ThemeToggle />
             </div>
          </div>
        </div>
      </header>
       <div className="grid flex-1 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
           <AdminSidebar />
        </aside>
        <main className="flex w-full flex-col overflow-hidden p-6">{children}</main>
      </div>
    </div>
  )
}
