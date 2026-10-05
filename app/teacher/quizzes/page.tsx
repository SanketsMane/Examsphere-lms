"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Brain,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  BarChart3,
  Users,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Download,
  Share2,
  Settings,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from "lucide-react";
import { toast } from "sonner";
import { QuizBuilder } from "@/components/quiz/QuizBuilder";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  questions: any[];
  course?: { title: string };
  chapter?: { title: string };
  lesson?: { title: string };
  _count: {
    attempts: number;
  };
}

interface Course {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
    }>;
  }>;
}

export default function QuizManagementPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchCourses();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quiz');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        toast.error("Failed to fetch quizzes");
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error("Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/teacher/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCreateQuiz = async (quizData: any) => {
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });

      if (response.ok) {
        toast.success("Quiz created successfully!");
        setShowCreateDialog(false);
        fetchQuizzes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create quiz");
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error("Failed to create quiz");
    }
  };

  const handleUpdateQuiz = async (quizId: string, quizData: any) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });

      if (response.ok) {
        toast.success("Quiz updated successfully!");
        setSelectedQuiz(null);
        fetchQuizzes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update quiz");
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error("Failed to update quiz");
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      const response = await fetch(`/api/quiz/${quizToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Quiz deleted successfully!");
        setShowDeleteDialog(false);
        setQuizToDelete(null);
        fetchQuizzes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete quiz");
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleToggleStatus = async (quiz: Quiz, field: 'isPublished' | 'isActive') => {
    try {
      const response = await fetch(`/api/quiz/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !quiz[field] })
      });

      if (response.ok) {
        toast.success(`Quiz ${field === 'isPublished' ? 'publication' : 'activation'} updated!`);
        fetchQuizzes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update quiz status");
      }
    } catch (error) {
      console.error('Error updating quiz status:', error);
      toast.error("Failed to update quiz status");
    }
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    try {
      const { id, createdAt, _count, ...quizData } = quiz;
      const duplicatedQuiz = {
        ...quizData,
        title: `${quiz.title} (Copy)`,
        isPublished: false
      };

      await handleCreateQuiz(duplicatedQuiz);
    } catch (error) {
      console.error('Error duplicating quiz:', error);
      toast.error("Failed to duplicate quiz");
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === "all" || quiz.courseId === selectedCourse;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && quiz.isPublished) ||
      (statusFilter === "draft" && !quiz.isPublished) ||
      (statusFilter === "active" && quiz.isActive) ||
      (statusFilter === "inactive" && !quiz.isActive);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const getStatusColor = (quiz: Quiz) => {
    if (quiz.isPublished && quiz.isActive) return "bg-green-100 text-green-800 border-green-200";
    if (quiz.isPublished && !quiz.isActive) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (!quiz.isPublished) return "bg-gray-100 text-gray-800 border-gray-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusText = (quiz: Quiz) => {
    if (quiz.isPublished && quiz.isActive) return "Published";
    if (quiz.isPublished && !quiz.isActive) return "Paused";
    if (!quiz.isPublished) return "Draft";
    return "Inactive";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-12 w-12 text-blue-600 mx-auto animate-pulse mb-4" />
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Quiz Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage interactive quizzes for your courses
          </p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Quizzes</p>
                <p className="text-2xl font-bold">{quizzes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-2xl font-bold">
                  {quizzes.filter(q => q.isPublished).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Attempts</p>
                <p className="text-2xl font-bold">
                  {quizzes.reduce((sum, q) => sum + q._count.attempts, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Questions</p>
                <p className="text-2xl font-bold">
                  {quizzes.reduce((sum, q) => sum + q.questions.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="ml-auto">
              {filteredQuizzes.length} of {quizzes.length} quizzes
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">No quizzes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCourse !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first quiz to get started"}
                </p>
                {!searchTerm && selectedCourse === "all" && statusFilter === "all" && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quiz
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{quiz.title}</h3>
                      <Badge className={getStatusColor(quiz)}>
                        {getStatusText(quiz)}
                      </Badge>
                      {quiz._count.attempts > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {quiz._count.attempts} attempts
                        </Badge>
                      )}
                    </div>

                    {quiz.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {quiz.course?.title || quiz.chapter?.title || quiz.lesson?.title || "Standalone"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{quiz.questions.length} questions</span>
                      </div>

                      {quiz.timeLimit && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{quiz.timeLimit} min</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(quiz.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Quick Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(quiz, 'isActive')}
                      disabled={!quiz.isPublished}
                    >
                      {quiz.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {/* More Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedQuiz(quiz)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Quiz
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleDuplicateQuiz(quiz)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(quiz, 'isPublished')}
                        >
                          {quiz.isPublished ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />


                        <DropdownMenuItem
                          onClick={() => {
                            setQuizToDelete(quiz);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 focus:text-red-600"
                          disabled={quiz._count.attempts > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Quiz
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Quiz Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setIsMaximized(false);
        }}
      >
        <DialogContent
          className={cn(
            "overflow-y-auto transition-all duration-200 block",
            isMaximized
              ? "!max-w-[100vw] !w-[100vw] !h-[100vh] !max-h-[100vh] !rounded-none !border-none !top-0 !left-0 !translate-x-0 !translate-y-0 !m-0"
              : "max-w-6xl max-h-[90vh]"
          )}
        >
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>
              Create an interactive quiz with multiple question types and advanced settings
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </DialogHeader>

          <QuizBuilder
            onSave={handleCreateQuiz}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Dialog */}
      <Dialog
        open={!!selectedQuiz}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuiz(null);
            setIsMaximized(false);
          }
        }}
      >
        <DialogContent
          className={cn(
            "overflow-y-auto transition-all duration-200 block",
            isMaximized
              ? "!max-w-[100vw] !w-[100vw] !h-[100vh] !max-h-[100vh] !rounded-none !border-none !top-0 !left-0 !translate-x-0 !translate-y-0 !m-0"
              : "max-w-6xl max-h-[90vh]"
          )}
        >
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Modify your quiz settings and questions
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </DialogHeader>

          {selectedQuiz && (
            <QuizBuilder
              initialData={selectedQuiz}
              onSave={(data) => handleUpdateQuiz(selectedQuiz.id, data)}
              onCancel={() => setSelectedQuiz(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quizToDelete?.title}"? This action cannot be undone.
              {quizToDelete?._count?.attempts && quizToDelete._count.attempts > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  This quiz has {quizToDelete?._count?.attempts || 0} student attempts and cannot be deleted.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              disabled={quizToDelete?._count?.attempts ? quizToDelete._count.attempts > 0 : false}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
