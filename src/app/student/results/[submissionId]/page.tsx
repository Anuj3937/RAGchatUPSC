
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import type { Submission, Test } from '@/lib/types';
import { Loader2, ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

function SubmissionResultsPage() {
  const { submissionId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;

    const subRef = doc(db, 'submissions', submissionId as string);
    const unsubscribe = onSnapshot(subRef, async (docSnap) => {
      if (docSnap.exists()) {
        const subData = { id: docSnap.id, ...docSnap.data() } as Submission;

        // Security check: ensure the user owns this submission or is a teacher for the class
        if (user?.role === 'student' && subData.studentId !== user.uid) {
            router.replace('/student');
            return;
        }

        setSubmission(subData);

        if (!subData.evaluation) {
            // If evaluation is not ready, keep listening.
            setIsLoading(true);
        } else {
            if (!test) {
                const testRef = doc(db, 'tests', subData.testId);
                const testSnap = await getDoc(testRef);
                if (testSnap.exists()) {
                    setTest({ id: testSnap.id, ...testSnap.data() } as Test);
                }
            }
            setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [submissionId, user, router, test]);
  
  if (isLoading || !submission?.evaluation) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
            {isLoading ? 'Loading results...' : 'Evaluation in progress, results will appear here automatically...'}
        </p>
      </div>
    );
  }
  
  if (!submission || !test) {
    return <div>Submission or test not found.</div>;
  }

  const { evaluation } = submission;
  const correctAnswers = evaluation.results.filter(r => r.isCorrect).length;
  const totalQuestions = evaluation.results.length;
  const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <AppHeader title={`Results for ${test.name}`} backLink={user?.role === 'student' ? '/student' : `/teacher/test/${test.id}`} />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-4">
                            Test Evaluation
                            <span className={cn("text-2xl font-bold", scorePercentage > 70 ? 'text-green-600' : scorePercentage > 40 ? 'text-yellow-600' : 'text-red-600')}>
                                {scorePercentage.toFixed(0)}%
                            </span>
                        </CardTitle>
                        <CardDescription>
                            You got {correctAnswers} out of {totalQuestions} questions correct.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-semibold text-lg mb-2 flex items-center">
                            <ClipboardCheck className="h-5 w-5 mr-2 text-accent" /> Overall Feedback
                        </h3>
                        <div className="p-4 rounded-md bg-primary/5">
                            <p className="whitespace-pre-wrap text-sm">{evaluation.overallFeedback}</p>
                        </div>
                    </CardContent>
                </Card>

                <h3 className="text-xl font-bold mb-4">Detailed Results</h3>
                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                  {evaluation.results.map((res, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                               {res.type === 'mcq' && (res.isCorrect ? 
                                    <CheckCircle className="h-5 w-5 text-green-600" /> : 
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                Question {index + 1}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <Card className={cn(res.type === 'mcq' ? (res.isCorrect ? 'border-green-500' : 'border-red-500') : 'border-border')}>
                            <CardHeader className={cn('p-4', res.type === 'mcq' ? (res.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10') : 'bg-muted/30')}>
                                <p className="font-semibold text-sm">
                                {res.question}
                                </p>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div>
                                <p className="font-semibold mb-1">Your Answer:</p>
                                <p className="text-muted-foreground p-2 bg-muted/50 rounded-md">{res.userAnswer || "No answer provided."}</p>
                                </div>
                                <div>
                                <p className="font-semibold mb-1">Explanation:</p>
                                <p className="text-muted-foreground p-2 bg-muted/50 rounded-md">{res.explanation}</p>
                                </div>
                            </CardContent>
                            </Card>
                        </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
            </div>
        </main>
    </div>
  );
}

export default withAuth(SubmissionResultsPage, ['student', 'teacher']);
