
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/components/auth/withAuth';
import type { Submission, Test, MCQQuestion, QuestionForEvaluation } from '@/lib/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { evaluateTestResults } from '@/ai/flows/evaluate-test-results';

function TakeTestPage() {
  const { submissionId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    const subRef = doc(db, 'submissions', submissionId as string);

    const unsubscribe = onSnapshot(subRef, async (docSnap) => {
        if (docSnap.exists()) {
            const subData = { id: docSnap.id, ...docSnap.data() } as Submission;
            setSubmission(subData);
            setAnswers(subData.answers);

            if (subData.evaluation) {
                // If test is already evaluated, redirect to results
                router.replace(`/student/results/${subData.id}`);
                return;
            }

            if (!test) { // Fetch test only once
                const testRef = doc(db, 'tests', subData.testId);
                const testSnap = await getDoc(testRef);
                if (testSnap.exists()) {
                    setTest({ id: testSnap.id, ...testSnap.data() } as Test);
                }
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
            // Handle not found
        }
    });

    return () => unsubscribe();
  }, [submissionId, router, test]);

  const handleAnswerChange = (qIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = value;
    setAnswers(newAnswers);
  };
  
  // Debounced update to Firestore
  useEffect(() => {
    if(!submissionId || isLoading) return;

    const timeoutId = setTimeout(async () => {
        if (JSON.stringify(submission?.answers) !== JSON.stringify(answers)) {
            const subRef = doc(db, 'submissions', submissionId as string);
            await updateDoc(subRef, { answers });
        }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [answers, submissionId, submission, isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!submission || !test) return;

    setIsSubmitting(true);
    try {
        const subRef = doc(db, 'submissions', submissionId as string);
        await updateDoc(subRef, { answers });

        const questionsForEval: QuestionForEvaluation[] = test.questions.map((q) => ({
            question: q.question,
            type: q.type,
            ...(q.type === 'mcq' && { options: (q as MCQQuestion).options, correctAnswer: (q as MCQQuestion).answer })
        }));
          
        const result = await evaluateTestResults({
            questions: questionsForEval,
            answers: answers,
            topic: test.name,
        });

        await updateDoc(subRef, { evaluation: result });

        toast({ title: "Test Submitted!", description: "Your results are being processed." });
        router.push(`/student/results/${submission.id}`);

    } catch (error) {
        console.error("Test submission failed:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your test.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!submission || !test) {
    return <div>Test not found.</div>;
  }
  
  const allQuestionsAnswered = answers.every(answer => answer && answer.trim() !== "");
  const isMCQ = test.questions[0].type === 'mcq';

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <AppHeader title={`Test: ${test.name}`} backLink='/student' />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{isMCQ ? 'Multiple-Choice Question Test' : 'Subjective Question Test'}</CardTitle>
                            <CardDescription>Answer all questions to the best of your ability. Your progress is saved automatically.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {test.questions.map((q, qIndex) => (
                                <div key={qIndex}>
                                    <Label className="font-semibold text-base">Question {qIndex + 1}: {q.question}</Label>
                                    <div className="mt-4">
                                        {q.type === 'mcq' ? (
                                            <RadioGroup onValueChange={(value) => handleAnswerChange(qIndex, value)} value={answers[qIndex]}>
                                                {(q as MCQQuestion).options.map((option: string, oIndex: number) => (
                                                    <div key={oIndex} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                                        <RadioGroupItem value={option} id={`q${qIndex}o${oIndex}`} />
                                                        <Label htmlFor={`q${qIndex}o${oIndex}`} className="font-normal cursor-pointer flex-grow">{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        ) : (
                                            <Textarea
                                                rows={5}
                                                value={answers[qIndex]}
                                                onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                placeholder="Your answer here..."
                                                disabled={isSubmitting}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting || !allQuestionsAnswered} className="w-full">
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</>
                                ) : 'Submit Final Answers'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </main>
    </div>
  );
}

export default withAuth(TakeTestPage, ['student']);
