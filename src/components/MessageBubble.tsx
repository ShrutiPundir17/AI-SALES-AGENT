import { Bot, User } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent';

  return (
    <div
      className={`flex items-start gap-3 ${
        isAgent ? 'flex-row' : 'flex-row-reverse'
      } animate-fade-in`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAgent
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-gradient-to-br from-gray-500 to-gray-700'
        }`}
      >
        {isAgent ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>

      <div className={`flex-1 max-w-[75%] ${isAgent ? '' : 'flex justify-end'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isAgent
              ? 'bg-white border border-gray-200 shadow-sm'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>

          {message.intent && isAgent && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Intent: {message.intent.replace('_', ' ')}
                {message.confidence && (
                  <span className="ml-1">
                    ({Math.round(message.confidence * 100)}%)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
