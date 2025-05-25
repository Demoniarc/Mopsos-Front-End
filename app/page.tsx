"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface Project {
  id: string
  name: string
  url: string
}

interface ProjectData {
  id: string
  twitter_user: number
  discord_user: number
  telegram_user: number
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsData, setProjectsData] = useState<ProjectData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('project')
          .select('*')
          .not('id', 'in', ['natix', 'oceanprotocol', 'propbase', 'stronghold', 'bittensor', 'unizen', 'zebec', 'numerai', 'fermion', 'zigchain'])

        if (projectsError) throw projectsError
        if (projectsData) {
          console.log('Projects data:', projectsData)  // Log fetched projects data
          setProjects(projectsData)
        }

        // Fetch latest metrics
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('execute_sql', {
            query: `
            SELECT t1.id, t1.twitter_user, t1.discord_user, t1.telegram_user
            FROM data t1
            JOIN (
            SELECT id, MAX(date) AS latest_date
            FROM data
            GROUP BY id
          ) t2
          ON t1.id = t2.id AND t1.date = t2.latest_date;
    `});

        if (metricsError) throw metricsError
        if (metricsData) {
          console.log('Metrics data:', metricsData)  // Log fetched metrics data
          setProjectsData(metricsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const getProjectData = (projectId: string) => {
    return projectsData.find(data => data.id === projectId)
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const data = getProjectData(project.id)
        
        return (
          <Link key={project.id} href={`/dashboard/${project.id}`}>
            <Card className="hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={project.url}
                      alt={`${project.name} logo`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover scale-102"
                      sizes="48px"
                    />
                  </div>
                </div>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="font-medium">Twitter</dt>
                    <dd>{data?.twitter_user}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Discord</dt>
                    <dd>{data?.discord_user}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Telegram</dt>
                    <dd>{data?.telegram_user}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
