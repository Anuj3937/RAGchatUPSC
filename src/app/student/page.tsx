
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, Loader2, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Test, Submission, UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import withAuth from '@/components/auth/withAuth';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

function StudentDashboard() {
  const { user } = useAuth();
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !user.classIds || user.classIds.length === 0) {
        setIsLoading(false);
        return;
    }

    const testsQuery = query(collection(db, 'tests'), where('classId', 'in', user.classIds));
    const unsubTests = onSnapshot(testsQuery, (snapshot) => {
      const testsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Test;
      });
      setAssignedTests(testsData);
      setIsLoading(false);
    });
    
    const submissionsQuery = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
    const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
        const subsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Submission));
        setSubmissions(subsData);
    });

    return () => {
      unsubTests();
      unsubSubmissions();
    }
  }, [user]);

  const handleStartTest = async (testId: string) => {
    if(!user) return;
    
    const existingSubmission = submissions.find(s => s.testId === testId);
    if(existingSubmission?.evaluation) {
        router.push(`/student/results/${existingSubmission.id}`);
        return;
    }
    
    if (existingSubmission) {
        router.push(`/student/test/${existingSubmission.id}`);
        return;
    }

    try {
      const test = assignedTests.find(t => t.id === testId);
      if (!test) throw new Error("Test not found");

      const submissionRef = await addDoc(collection(db, 'submissions'), {
          testId,
          studentId: user.uid,
          classId: test.classId,
          answers: Array(test.questions.length).fill(''),
          submittedAt: serverTimestamp(),
          evaluation: null
      });
      router.push(`/student/test/${submissionRef.id}`);

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error starting test', description: 'Could not create a new submission.'});
    }
  };

  const getSubmissionStatus = (testId: string) => {
      const submission = submissions.find(s => s.testId === testId);
      if (submission?.evaluation) {
          return <Badge variant="default">Completed</Badge>;
      }
      if (submission) {
          return <Badge variant="secondary">In Progress</Badge>
      }
      return <Badge variant="outline">Not Started</Badge>
  }
  
  const getActionForTest = (testId: string) => {
    const submission = submissions.find(s => s.testId === testId);
    if (submission?.evaluation) {
        return "View Results";
    }
    if (submission) {
        return "Continue Test";
    }
    return "Start Test";
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
       <AppHeader title="Student Dashboard" />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Tests</CardTitle>
                <CardDescription>Tests assigned by your teachers. Complete them to assess your knowledge.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Assigned On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedTests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No tests assigned yet.</TableCell>
                        </TableRow>
                    ) : (
                        assignedTests.map((test) => (
                        <TableRow key={test.id}>
                            <TableCell className="font-medium">{test.name}</TableCell>
                            <TableCell>{format(test.createdAt as unknown as Date, 'PPP')}</TableCell>
                            <TableCell>{getSubmissionStatus(test.id)}</TableCell>
                            <TableCell className="text-right">
                            <Button size="sm" onClick={() => handleStartTest(test.id)}>
                                {getActionForTest(test.id)}
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Self Practice</CardTitle>
                <CardDescription>Use AI tools to generate summaries, tests, and flashcards on any topic.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                    <Link href="/prep">
                        Go to Practice Session <ArrowRight className="ml-2"/>
                    </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>My Results</CardTitle>
                <CardDescription>Review your past test submissions and evaluations.</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.filter(s => s.evaluation).length > 0 ? (
                    <ul className="space-y-2">
                        {submissions.filter(s => s.evaluation).map(sub => {
                            const test = assignedTests.find(t => t.id === sub.testId);
                            return (
                                <li key={sub.id}>
                                    <Link href={`/student/results/${sub.id}`}>
                                        <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50">
                                            <span>{test?.name || 'Test'}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                                        </div>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No completed tests yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(StudentDashboard, ['student']);
