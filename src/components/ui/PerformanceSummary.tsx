import React from 'react';
import { Award, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PerformanceSummaryProps {
  overallPercentage: number;
  latestExamPercentage: number;
  latestExamType: string;
  previousPercentage?: number;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  overallPercentage,
  latestExamPercentage,
  latestExamType,
  previousPercentage,
}) => {
  const getPerformanceGrade = (percentage: number) => {
    if (percentage >= 90) return 'Outstanding';
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const getPerformanceRemarks = (overall: number, latest: number, previous?: number) => {
    const remarks = [];
    
    // Overall performance remarks
    remarks.push(
      overall >= 70 
        ? "Demonstrates consistent academic excellence."
        : overall >= 50
        ? "Shows steady academic progress."
        : "Has potential for improvement."
    );

    // Trend analysis
    if (previous && latest) {
      const improvement = latest - previous;
      if (improvement > 5) {
        remarks.push("Shows significant improvement in recent performance.");
      } else if (improvement < -5) {
        remarks.push("Recent performance indicates need for additional focus.");
      } else {
        remarks.push("Maintains consistent performance level.");
      }
    }

    // Specific recommendations
    if (latest < overall) {
      remarks.push("Consider reviewing recent topics for better understanding.");
    } else if (latest > overall && latest > 70) {
      remarks.push("Recent performance shows excellent progress.");
    }

    return remarks;
  };

  const getTrendIcon = (latest: number, previous?: number) => {
    if (!previous) return <Minus className="w-5 h-5" />;
    if (latest > previous + 2) return <ArrowUp className="w-5 h-5 text-green-500" />;
    if (latest < previous - 2) return <ArrowDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const performanceRemarks = getPerformanceRemarks(overallPercentage, latestExamPercentage, previousPercentage);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-purple-600';
    if (percentage >= 80) return 'text-indigo-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-purple-500';
    if (percentage >= 80) return 'bg-indigo-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white">
      {/* Header Section with Glowing Effect */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 mb-8">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.2] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Academic Performance</h2>
            <p className="text-blue-100">Your learning journey visualized</p>
          </div>
        </div>
      </div>
      
      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Overall Performance Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Overall Performance</h3>
                  <p className={`text-2xl font-bold ${getGradeColor(overallPercentage)}`}>
                    {overallPercentage}%
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressBarColor(overallPercentage)} transition-all duration-700 ease-out shadow-sm`}
                  style={{ width: `${Math.min(100, overallPercentage)}%` }}
                >
                  <div className="w-full h-full opacity-50 bg-stripe-white animate-scroll" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm text-gray-600">Achievement Level</span>
              <span className={`font-bold ${getGradeColor(overallPercentage)} px-3 py-1 rounded-lg bg-opacity-10`}>
                {getPerformanceGrade(overallPercentage)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Latest Exam Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Latest Exam ({latestExamType})</h3>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${getGradeColor(latestExamPercentage)}`}>
                      {latestExamPercentage}%
                    </p>
                    {getTrendIcon(latestExamPercentage, previousPercentage)}
                  </div>
                </div>
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressBarColor(latestExamPercentage)} transition-all duration-700 ease-out shadow-sm`}
                  style={{ width: `${Math.min(100, latestExamPercentage)}%` }}
                >
                  <div className="w-full h-full opacity-50 bg-stripe-white animate-scroll" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm text-gray-600">Achievement Level</span>
              <span className={`font-bold ${getGradeColor(latestExamPercentage)} px-3 py-1 rounded-lg bg-opacity-10`}>
                {getPerformanceGrade(latestExamPercentage)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          Performance Insights
        </h3>
        <div className="space-y-4">
          {performanceRemarks.map((remark, index) => (
            <div 
              key={index}
              className="group flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all cursor-default"
            >
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 leading-relaxed">{remark}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceSummary;