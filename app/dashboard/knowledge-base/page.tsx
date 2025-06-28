"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Book,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  FileText,
} from "lucide-react"

const knowledgeBase = [
  {
    id: "member-management",
    title: "Member Management",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
    articles: [
      {
        id: "1",
        title: "Adding New Members",
        content: "Learn how to add new members to your gym...",
        tags: ["basics", "members"],
      },
      {
        id: "2",
        title: "Managing Member Subscriptions",
        content: "Handle subscription renewals and upgrades...",
        tags: ["subscriptions", "billing"],
      },
      {
        id: "3",
        title: "Member Check-in Process",
        content: "Set up and manage member check-ins...",
        tags: ["check-in", "access"],
      },
      {
        id: "4",
        title: "Handling Member Complaints",
        content: "Best practices for customer service...",
        tags: ["support", "complaints"],
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Payments",
    icon: CreditCard,
    color: "bg-green-100 text-green-600",
    articles: [
      {
        id: "5",
        title: "Setting Up Payment Methods",
        content: "Configure payment gateways and options...",
        tags: ["payments", "setup"],
      },
      {
        id: "6",
        title: "Creating Invoices",
        content: "Generate and send invoices to members...",
        tags: ["invoices", "billing"],
      },
      {
        id: "7",
        title: "Managing Overdue Payments",
        content: "Handle late payments and penalties...",
        tags: ["overdue", "penalties"],
      },
      {
        id: "8",
        title: "Tax Configuration",
        content: "Set up tax rates and compliance...",
        tags: ["tax", "compliance"],
      },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling & Classes",
    icon: Calendar,
    color: "bg-purple-100 text-purple-600",
    articles: [
      {
        id: "9",
        title: "Creating Class Schedules",
        content: "Set up group fitness classes...",
        tags: ["classes", "schedule"],
      },
      {
        id: "10",
        title: "Booking Personal Training",
        content: "Manage PT sessions and trainer availability...",
        tags: ["personal-training", "booking"],
      },
      {
        id: "11",
        title: "Room and Equipment Booking",
        content: "Manage facility bookings...",
        tags: ["facilities", "equipment"],
      },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: BarChart3,
    color: "bg-orange-100 text-orange-600",
    articles: [
      {
        id: "12",
        title: "Generating Sales Reports",
        content: "Create detailed sales analytics...",
        tags: ["sales", "reports"],
      },
      {
        id: "13",
        title: "Member Analytics",
        content: "Track member engagement and retention...",
        tags: ["analytics", "members"],
      },
      {
        id: "14",
        title: "Attendance Reports",
        content: "Monitor gym usage patterns...",
        tags: ["attendance", "usage"],
      },
    ],
  },
]

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSections, setExpandedSections] = useState<string[]>(["member-management"])
  const [selectedArticle, setSelectedArticle] = useState<any>(null)

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const filteredSections = knowledgeBase
    .map((section) => ({
      ...section,
      articles: section.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    }))
    .filter((section) => section.articles.length > 0 || searchTerm === "")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">Find answers and learn how to use the gym management system</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Article
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredSections.map((section) => (
                <div key={section.id} className="space-y-2">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${section.color}`}>
                        <section.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {expandedSections.includes(section.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSections.includes(section.id) && (
                    <div className="ml-6 space-y-1">
                      {section.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className={`block w-full text-left p-2 rounded-md text-sm hover:bg-gray-50 transition-colors ${
                            selectedArticle?.id === article.id ? "bg-teal-50 text-teal-700" : "text-gray-600"
                          }`}
                        >
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedArticle ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{selectedArticle.title}</span>
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed">{selectedArticle.content}</p>

                {/* Sample detailed content */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Step-by-step Guide</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Navigate to the relevant section in the dashboard</li>
                    <li>Click on the appropriate action button</li>
                    <li>Fill in the required information</li>
                    <li>Review and confirm your changes</li>
                    <li>Save the configuration</li>
                  </ol>

                  <h3 className="text-lg font-semibold">Best Practices</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Always double-check member information before saving</li>
                    <li>Keep backup copies of important data</li>
                    <li>Regularly update member contact information</li>
                    <li>Monitor system performance and user feedback</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Troubleshooting</h3>
                  <p className="text-gray-600">
                    If you encounter any issues, check the system logs or contact support for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Book className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Article</h3>
                <p className="text-gray-600 text-center">
                  Choose an article from the sidebar to view its content, or use the search to find specific topics.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
