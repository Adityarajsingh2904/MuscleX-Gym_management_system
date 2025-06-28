"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Users, Calendar, TrendingUp } from "lucide-react"

interface TrainerData {
  id: string
  name: string
  avatar?: string
  specialization: string
  rating: number
  totalClasses: number
  totalMembers: number
  revenue: number
  growth: number
  skills: {
    technique: number
    motivation: number
    punctuality: number
    communication: number
    knowledge: number
  }
}

interface TrainerPerformanceProps {
  data?: TrainerData[]
  chartType?: "bar" | "radar"
}

const mockData: TrainerData[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    specialization: "Yoga & Pilates",
    rating: 4.9,
    totalClasses: 156,
    totalMembers: 89,
    revenue: 15600,
    growth: 12.5,
    skills: {
      technique: 95,
      motivation: 92,
      punctuality: 98,
      communication: 94,
      knowledge: 96,
    },
  },
  {
    id: "2",
    name: "Mike Chen",
    specialization: "HIIT & Cardio",
    rating: 4.7,
    totalClasses: 142,
    totalMembers: 76,
    revenue: 14200,
    growth: 8.3,
    skills: {
      technique: 88,
      motivation: 95,
      punctuality: 90,
      communication: 87,
      knowledge: 89,
    },
  },
  {
    id: "3",
    name: "David Wilson",
    specialization: "Strength Training",
    rating: 4.8,
    totalClasses: 134,
    totalMembers: 82,
    revenue: 16800,
    growth: 15.2,
    skills: {
      technique: 93,
      motivation: 89,
      punctuality: 95,
      communication: 91,
      knowledge: 94,
    },
  },
  {
    id: "4",
    name: "Emma Davis",
    specialization: "Dance & Aerobics",
    rating: 4.6,
    totalClasses: 128,
    totalMembers: 71,
    revenue: 12800,
    growth: 5.7,
    skills: {
      technique: 90,
      motivation: 96,
      punctuality: 88,
      communication: 93,
      knowledge: 85,
    },
  },
  {
    id: "5",
    name: "Alex Rodriguez",
    specialization: "CrossFit",
    rating: 4.8,
    totalClasses: 145,
    totalMembers: 85,
    revenue: 17250,
    growth: 18.9,
    skills: {
      technique: 92,
      motivation: 94,
      punctuality: 93,
      communication: 89,
      knowledge: 91,
    },
  },
]

export function TrainerPerformance({ data = mockData, chartType = "bar" }: TrainerPerformanceProps) {
  const topPerformer = data.reduce((max, trainer) => (trainer.revenue > max.revenue ? trainer : max), data[0])
  const averageRating = data.reduce((sum, trainer) => sum + trainer.rating, 0) / data.length
  const totalRevenue = data.reduce((sum, trainer) => sum + trainer.revenue, 0)

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    classes: {
      label: "Classes",
      color: "hsl(var(--chart-2))",
    },
    members: {
      label: "Members",
      color: "hsl(var(--chart-3))",
    },
  }

  const radarData = topPerformer
    ? [
        { skill: "Technique", value: topPerformer.skills.technique },
        { skill: "Motivation", value: topPerformer.skills.motivation },
        { skill: "Punctuality", value: topPerformer.skills.punctuality },
        { skill: "Communication", value: topPerformer.skills.communication },
        { skill: "Knowledge", value: topPerformer.skills.knowledge },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trainer Performance</CardTitle>
        <CardDescription>Individual trainer metrics and performance analysis</CardDescription>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Top Performer: </span>
            <span className="font-semibold">{topPerformer?.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Average Rating: </span>
            <span className="font-semibold">{averageRating.toFixed(1)}/5.0</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Revenue: </span>
            <span className="font-semibold">${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {chartType === "bar" ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.3}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-3">
                <h4 className="font-medium">Top Performer Skills</h4>
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarImage src={topPerformer?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {topPerformer?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h5 className="font-medium">{topPerformer?.name}</h5>
                  <p className="text-sm text-muted-foreground">{topPerformer?.specialization}</p>
                  <div className="flex items-center justify-center mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{topPerformer?.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trainer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((trainer) => (
              <div key={trainer.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={trainer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {trainer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{trainer.name}</h4>
                    <p className="text-sm text-muted-foreground">{trainer.specialization}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{trainer.rating}</span>
                  </div>
                  <Badge variant={trainer.growth > 10 ? "default" : "secondary"}>
                    <TrendingUp className="h-3 w-3 mr-1" />+{trainer.growth}%
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-3 w-3" />
                    </div>
                    <div className="font-medium">{trainer.totalClasses}</div>
                    <div className="text-muted-foreground">Classes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-3 w-3" />
                    </div>
                    <div className="font-medium">{trainer.totalMembers}</div>
                    <div className="text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">${trainer.revenue.toLocaleString()}</div>
                    <div className="text-muted-foreground">Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
