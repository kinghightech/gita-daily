// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ChevronRight, Trophy, XCircle } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function LevelContent({ level, onComplete, onBack }) {
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    const handleAnswer = (index) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);
        
        if (index === level.quiz[currentQuestion].correct) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestion < level.quiz.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setShowResults(true);
        }
    };

    const handleComplete = () => {
        const finalScore = Math.round((score / level.quiz.length) * 100);
        if (finalScore >= 66) {
            toast.success(`Level ${level.id} completed!`);
            onComplete(level.id, finalScore);
        } else {
            toast.error("You need at least 2/3 correct to pass. Try again!");
            setShowQuiz(false);
            setCurrentQuestion(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setScore(0);
            setShowResults(false);
        }
    };

    if (showResults) {
        const passed = score >= 2;
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto"
            >
                <Card className="bg-slate-900/90 border-amber-400/30">
                    <CardContent className="p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                        >
                            {passed ? (
                                <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
                            ) : (
                                <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                            )}
                        </motion.div>
                        
                        <h2 className="text-2xl font-serif text-amber-100 mb-2">
                            {passed ? "Congratulations!" : "Keep Learning!"}
                        </h2>
                        <p className="text-amber-300/70 mb-4">
                            You scored {score} out of {level.quiz.length}
                        </p>
                        
                        <div className="flex gap-3 justify-center">
                            {passed ? (
                                <Button
                                    onClick={handleComplete}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                >
                                    Continue Journey
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={onBack}
                                        variant="outline"
                                        className="border-amber-400/30 text-amber-300"
                                    >
                                        Back to Journey
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowQuiz(false);
                                            setCurrentQuestion(0);
                                            setSelectedAnswer(null);
                                            setIsAnswered(false);
                                            setScore(0);
                                            setShowResults(false);
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                    >
                                        Try Again
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (showQuiz) {
        const question = level.quiz[currentQuestion];
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-lg mx-auto"
            >
                <Card className="bg-slate-900/90 border-amber-400/30">
                    <CardContent className="p-6">
                        {/* Progress */}
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-amber-300/70 text-sm">
                                Question {currentQuestion + 1} of {level.quiz.length}
                            </span>
                            <div className="flex gap-1">
                                {level.quiz.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                            i < currentQuestion 
                                                ? 'bg-amber-400' 
                                                : i === currentQuestion 
                                                    ? 'bg-amber-500' 
                                                    : 'bg-slate-600'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-xl text-amber-100 font-medium mb-6">
                            {question.question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3">
                            {question.options.map((option, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleAnswer(index)}
                                    disabled={isAnswered}
                                    whileHover={!isAnswered ? { scale: 1.02 } : {}}
                                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${
                                        isAnswered
                                            ? index === question.correct
                                                ? 'bg-green-500/20 border-green-500 border-2'
                                                : index === selectedAnswer
                                                    ? 'bg-red-500/20 border-red-500 border-2'
                                                    : 'bg-slate-800/50 border border-slate-700'
                                            : 'bg-slate-800/50 border border-amber-400/20 hover:border-amber-400/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`${
                                            isAnswered && index === question.correct
                                                ? 'text-green-300'
                                                : isAnswered && index === selectedAnswer
                                                    ? 'text-red-300'
                                                    : 'text-amber-100'
                                        }`}>
                                            {option}
                                        </span>
                                        {isAnswered && index === question.correct && (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        )}
                                        {isAnswered && index === selectedAnswer && index !== question.correct && (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Next Button */}
                        <AnimatePresence>
                            {isAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6"
                                >
                                    <Button
                                        onClick={handleNext}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900"
                                    >
                                        {currentQuestion < level.quiz.length - 1 ? 'Next Question' : 'See Results'}
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            {/* Back Button */}
            <Button
                onClick={onBack}
                variant="ghost"
                className="mb-4 text-amber-300 hover:text-amber-100 hover:bg-slate-800"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journey
            </Button>

            <Card className="bg-slate-900/90 border-amber-400/30 overflow-hidden">
                {/* Hero Image */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={level.image}
                        alt={level.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                        <span className="text-amber-400 text-sm">Level {level.id}</span>
                        <h1 className="text-2xl font-serif text-amber-100">{level.title}</h1>
                        <p className="text-amber-300/70 text-sm">{level.subtitle}</p>
                    </div>
                </div>

                <CardContent className="p-6">
                    {/* Article Content */}
                    <div className="prose prose-invert prose-amber max-w-none">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="text-amber-100/90 mb-4 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="text-amber-300 font-semibold">{children}</strong>,
                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-amber-100/80">{children}</ul>,
                                li: ({ children }) => <li>{children}</li>,
                            }}
                        >
                            {level.content}
                        </ReactMarkdown>
                    </div>

                    {/* Start Quiz Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 pt-6 border-t border-amber-400/20"
                    >
                        <div className="text-center">
                            <p className="text-amber-300/60 mb-4">
                                Ready to test your knowledge? Complete a short quiz to unlock the next level.
                            </p>
                            <Button
                                onClick={() => setShowQuiz(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8"
                            >
                                Take the Quiz
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
}