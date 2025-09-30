
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookText, ClipboardCheck, Sparkles, ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      switch(user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'teacher':
          router.push('/teacher');
          break;
        case 'student':
          router.push('/student');
          break;
        default:
          router.push('/login'); // Fallback to login if role is unknown
          break;
      }
    } else {
      router.push('/login');
    }
  };

  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "AI Summarization",
      description:
        "Upload your PDF documents or specify a topic to get concise, AI-generated summaries, distilling key information for quick revision.",
    },
    {
      icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
      title: "Dynamic Test Generation",
      description:
        "Challenge yourself with custom-generated tests. Choose between multiple-choice questions (MCQs) or subjective questions on any topic.",
    },
    {
      icon: <BookText className="h-8 w-8 text-primary" />,
      title: "Instant AI Evaluation",
      description:
        "Receive immediate, detailed feedback on your test performance. Understand your mistakes with clear explanations and improve your strategy.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-primary"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
                <h1 className="text-2xl font-bold text-primary">UPSC Prep Portal</h1>
            </div>
             <div>
              {!user && !loading ? (
                <Button asChild variant="outline">
                  <Link href="/login">
                    <LogIn className="mr-2" /> Login
                  </Link>
                </Button>
              ) : (
                !loading && <Button onClick={handleGetStarted}>Go to Dashboard</Button>
              )}
            </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Supercharge Your UPSC Preparation
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground">
              Leverage the power of AI to learn faster, test smarter, and achieve your goal. Get instant summaries, generate custom tests, and receive detailed evaluations.
            </p>
            <div className="mt-8">
              <Button onClick={handleGetStarted} size="lg">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-card py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h3>
              <p className="mt-4 text-lg text-muted-foreground">
                A seamless three-step process to elevate your learning.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4 text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-foreground">Built for the Modern Aspirant</h3>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Our platform integrates cutting-edge generative AI to provide a personalized and adaptive learning experience. Move beyond static question banks and passive reading. Engage with your study material in a new, interactive way.
                    </p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-start">
                            <CheckIcon className="h-6 w-6 text-accent flex-shrink-0 mr-3" />
                            <span className="text-muted-foreground">Personalized learning paths based on your inputs.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckIcon className="h-6 w-6 text-accent flex-shrink-0 mr-3" />
                            <span className="text-muted-foreground">Focus on understanding, not just memorization.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckIcon className="h-6 w-6 text-accent flex-shrink-0 mr-3" />
                            <span className="text-muted-foreground">Accessible anytime, anywhere, on any device.</span>
                        </li>
                    </ul>
                </div>
                 <div>
                    <Image 
                        src="https://picsum.photos/seed/1/600/400"
                        alt="A student studying"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-2xl"
                        data-ai-hint="student studying"
                    />
                </div>
            </div>
        </section>

      </main>

      <footer className="bg-white dark:bg-card border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UPSC Prep Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
