"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search } from 'lucide-react'
import { supabase } from "@/lib/supabase"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface Project {
  id: string
  name: string
  logo: string
}

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('project')
          .select('*')
        
        if (error) throw error
        if (data) {
          setProjects(data)
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      }
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        )}
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search a coin...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search a coin..." />
        <CommandList>
          <CommandEmpty>No result found.</CommandEmpty>
          <CommandGroup heading="Coins">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                onSelect={() => runCommand(() => router.push(`/dashboard/${project.id}`))}
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                  {project.logo}
                </div>
                <span>{project.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

