"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Check } from "lucide-react"
import Image from "next/image"

interface Project {
  id: string
  name: string
  url: string
}

interface ProjectSelectorProps {
  projects: Project[]
  selectedProject: Project | null
  onProjectSelect: (project: Project | null) => void
  placeholder?: string
}

export function ProjectSelector({ 
  projects, 
  selectedProject, 
  onProjectSelect, 
  placeholder = "Select a project..." 
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleProjectSelect = (project: Project) => {
    onProjectSelect(project)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleClear = () => {
    onProjectSelect(null)
    setSearchTerm("")
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedProject ? (
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 relative rounded-full overflow-hidden">
              <Image
                src={selectedProject.url}
                alt={`${selectedProject.name} logo`}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span>{selectedProject.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {selectedProject && (
                <button
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between border-b"
                  onClick={handleClear}
                >
                  <span className="text-sm text-muted-foreground">Clear selection</span>
                </button>
              )}
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center space-x-3"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="w-6 h-6 relative rounded-full overflow-hidden">
                    <Image
                      src={project.url}
                      alt={`${project.name} logo`}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="flex-1">{project.name}</span>
                  {selectedProject?.id === project.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
              {filteredProjects.length === 0 && (
                <div className="px-3 py-6 text-center text-muted-foreground">
                  No projects found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
