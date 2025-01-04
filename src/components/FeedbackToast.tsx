import React, { useEffect, useState } from 'react';
import type { UserFeedback } from '../lib/analytics';

interface FeedbackToastProps {
  feedback: UserFeedback;
  onDismiss: () => void;
}

export function FeedbackToast({ feedback, onDismiss }: FeedbackToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // アニメーション完了後に削除
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const iconStyles = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border shadow-lg transition-all duration-300 ${
        typeStyles[feedback.type]
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{iconStyles[feedback.type]}</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{feedback.message}</p>
          {feedback.context && (
            <div className="mt-2 text-xs opacity-75">
              {Object.entries(feedback.context).map(([key, value]) => (
                <div key={key}>
                  {key}: {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="ml-auto flex-shrink-0 -mt-1 -mr-1 p-1 rounded-full hover:bg-black/5 transition-colors"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
        >
          <span className="sr-only">閉じる</span>
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
}

interface FeedbackToastContainerProps {
  feedbackList: UserFeedback[];
  onDismiss: (feedback: UserFeedback) => void;
}

export function FeedbackToastContainer({
  feedbackList,
  onDismiss,
}: FeedbackToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50 pointer-events-none">
      <div className="space-y-2 pointer-events-auto">
        {feedbackList.map((feedback) => (
          <FeedbackToast
            key={feedback.timestamp}
            feedback={feedback}
            onDismiss={() => onDismiss(feedback)}
          />
        ))}
      </div>
    </div>
  );
}

export type { FeedbackToastProps, FeedbackToastContainerProps }; 