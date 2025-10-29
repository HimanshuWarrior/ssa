import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';

interface StudentFilterSortProps {
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
  onFilterChange: (filterType: string, value: any) => void;
  currentSort: { by: string; order: 'asc' | 'desc' };
  filters: {
    percentageMin?: number;
    percentageMax?: number;
    nameStartsWith?: string;
    nameEndsWith?: string;
    classSection?: string;
    subject?: string;
    exam?: string;
  };
  availableClasses?: string[];
  availableSubjects?: string[];
  availableExams?: string[];
  showClassFilter?: boolean;
}

const StudentFilterSort: React.FC<StudentFilterSortProps> = ({
  onSortChange,
  onFilterChange,
  currentSort,
  filters,
  availableClasses = [],
  availableSubjects = [],
  availableExams = [],
  showClassFilter = false
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4 border-2 border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Filter & Sort</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Sort By
          </label>
          <select
            value={`${currentSort.by}-${currentSort.order}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              onSortChange(by, order as 'asc' | 'desc');
            }}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name-asc">Name (A to Z)</option>
            <option value="name-desc">Name (Z to A)</option>
            <option value="latest_percentage-desc">Latest % (High to Low)</option>
            <option value="latest_percentage-asc">Latest % (Low to High)</option>
            <option value="overall_percentage-desc">Overall % (High to Low)</option>
            <option value="overall_percentage-asc">Overall % (Low to High)</option>
            <option value="admission_id-asc">Admission ID (A to Z)</option>
            <option value="admission_id-desc">Admission ID (Z to A)</option>
          </select>
        </div>

        {showClassFilter && availableClasses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              value={filters.classSection || ''}
              onChange={(e) => onFilterChange('classSection', e.target.value || undefined)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        )}

        {availableSubjects && availableSubjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Subject
            </label>
            <select
              value={filters.subject || ''}
              onChange={(e) => onFilterChange('subject', e.target.value || undefined)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}

        {availableExams && availableExams.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Exam
            </label>
            <select
              value={filters.exam || ''}
              onChange={(e) => onFilterChange('exam', e.target.value || undefined)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Exams</option>
              {availableExams.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Percentage Range (Min)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.percentageMin || ''}
            onChange={(e) => onFilterChange('percentageMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 60"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Percentage Range (Max)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.percentageMax || ''}
            onChange={(e) => onFilterChange('percentageMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 90"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name Starts With
          </label>
          <input
            type="text"
            maxLength={1}
            value={filters.nameStartsWith || ''}
            onChange={(e) => onFilterChange('nameStartsWith', e.target.value.toUpperCase())}
            placeholder="e.g., A"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name Ends With
          </label>
          <input
            type="text"
            maxLength={1}
            value={filters.nameEndsWith || ''}
            onChange={(e) => onFilterChange('nameEndsWith', e.target.value.toUpperCase())}
            placeholder="e.g., Z"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              onFilterChange('percentageMin', undefined);
              onFilterChange('percentageMax', undefined);
              onFilterChange('nameStartsWith', undefined);
              onFilterChange('nameEndsWith', undefined);
              onFilterChange('classSection', undefined);
              onFilterChange('subject', undefined);
              onFilterChange('exam', undefined);
              onSortChange('name', 'asc');
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentFilterSort;
