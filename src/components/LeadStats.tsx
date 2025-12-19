import { TrendingUp, Target, Flame, Snowflake, ThermometerSun } from 'lucide-react';

interface LeadStatsProps {
  score: number;
  status: string;
  totalMessages: number;
}

export default function LeadStats({ score, status, totalMessages }: LeadStatsProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'hot':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'warm':
        return <ThermometerSun className="w-5 h-5 text-yellow-500" />;
      case 'cold':
        return <Snowflake className="w-5 h-5 text-blue-400" />;
      default:
        return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'hot':
        return 'from-orange-500 to-red-500';
      case 'warm':
        return 'from-yellow-400 to-orange-500';
      case 'cold':
        return 'from-blue-400 to-blue-600';
      case 'not_interested':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-gray-300 to-gray-500';
    }
  };

  const getScoreColor = () => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStatusColor()} flex items-center justify-center`}>
            {getStatusIcon()}
          </div>
          <div>
            <p className="text-sm text-gray-600">Lead Status</p>
            <p className="font-semibold text-gray-900 capitalize">
              {status.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-600">Lead Score</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getScoreColor()}`}>{score}</p>
              <TrendingUp className={`w-4 h-4 ${getScoreColor()}`} />
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Messages</p>
            <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Engagement Level</span>
          <span>{score}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 ease-out`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
