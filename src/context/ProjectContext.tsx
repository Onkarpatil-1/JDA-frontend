import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ProjectData, ProjectMetadata } from '../types';
import { analyzeWorkflowData } from '../utils/dataAnalyzer';

// API Base URL
import API_BASE from '../lib/api';


interface FilterState {
    search: string;
    zone: string;
    department: string;
    date: string;
}

interface ProjectContextType {
    projects: ProjectMetadata[];
    currentProject: ProjectData | null;
    loading: boolean;
    error: string | null;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    uploadCSV: (file: File, projectName: string, aiProvider?: string, apiKey?: string) => Promise<void>;
    selectProject: (projectId: string) => Promise<void>;
    refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
};

interface ProjectProviderProps {
    children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
    const [projects, setProjects] = useState<ProjectMetadata[]>([]);
    const [rawData, setRawData] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<FilterState>({
        search: '',
        zone: 'All',
        department: 'All',
        date: ''
    });

    // Load projects on mount
    useEffect(() => {
    }, []); // Removed refreshProjects call here to avoid double loading or errors on strict mode, it is called below

    useEffect(() => {
        refreshProjects();
    }, []);

    const refreshProjects = async () => {
        try {
            const response = await fetch(`${API_BASE}/project/list`);
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (err) {
            console.error('Failed to load projects:', err);
            setError('Failed to load projects');
        }
    };

    const uploadCSV = async (file: File, projectName: string, aiProvider: string = 'ollama', apiKey?: string) => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', projectName);
            formData.append('aiProvider', aiProvider);
            if (apiKey) {
                formData.append('apiKey', apiKey.trim());
            }

            const response = await fetch(`${API_BASE}/project/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            // Refresh project list
            await refreshProjects();

            // Auto-select the newly uploaded project
            if (data.project?.id) {
                await selectProject(data.project.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const selectProject = async (projectId: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/project/${projectId}`);
            if (!response.ok) {
                throw new Error('Failed to load project');
            }

            const data = await response.json();
            setRawData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load project');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Calculate filtered project data
    const currentProject = useMemo(() => {
        if (!rawData) return null;

        const { workflowSteps } = rawData;
        if (!workflowSteps) return rawData; // Should not happen with new backend but safety check

        let filteredSteps = [...workflowSteps];

        // Filter by Zone
        if (filters.zone !== 'All') {
            filteredSteps = filteredSteps.filter(step => step.zoneId === filters.zone);
        }

        // Filter by Department (Role/Post)
        if (filters.department !== 'All') {
            filteredSteps = filteredSteps.filter(step => step.post === filters.department);
        }

        // Filter by Date (Application Date)
        if (filters.date) {
            // Simple exact match for now, or maybe >= date?
            // Assuming date picker returns YYYY-MM-DD and step.applicationDate might be different format
            // Let's do a simple includes or normalized comparison if needed
            // For now, let's filter if it *matches* the date string exactly or starts with it
            // Actually, usually date filters are "since" or specific day. Let's start with check if date string is contained.
            // Converting to standard format would be better but keeping simple for MVP.
            // If date is "2024-02-06", check if applicationDate (e.g. "12/1/2025") matches?
            // Date formats might be different (MM/DD/YYYY).
            // Let's skip date filtering logic complexity for this specific step unless user asked for it specifically.
            // User asked "header filters working". The date picker has a default value.
            // Let's implement basic date filtering: convert input to M/D/YYYY if possible to match CSV default.
            // Input type="date" gives YYYY-MM-DD.
            // CSV has "12/1/2025".
            // Let's parse both to timestamps for comparison.

            try {
                const filterDate = new Date(filters.date).setHours(0, 0, 0, 0);
                if (!isNaN(filterDate)) {
                    filteredSteps = filteredSteps.filter(step => {
                        const stepDate = new Date(step.applicationDate).setHours(0, 0, 0, 0);
                        return !isNaN(stepDate) && stepDate >= filterDate; // Filter for "on or after"
                    });
                }
            } catch (e) {
                // ignore invalid date
            }
        }

        // Filter by Search (Global search spanning multiple fields)
        if (filters.search) {
            const query = filters.search.toLowerCase();
            filteredSteps = filteredSteps.filter(step =>
                step.ticketId.toLowerCase().includes(query) ||
                step.serviceName.toLowerCase().includes(query) ||
                (step.applicantName && step.applicantName.toLowerCase().includes(query)) ||
                step.zoneId.toLowerCase().includes(query)
            );
        }

        // If no rows left, return empty statistics structure (or re-analyze empty)
        const newStatistics = analyzeWorkflowData(filteredSteps, rawData.statistics.jdaHierarchy);

        // Preserve AI insights from original if not re-calculated (backend does complex AI)
        // But statistics are re-calculated.
        return {
            ...rawData,
            statistics: {
                ...newStatistics,
                // Keep AI insights from the original rawData context if they exist, 
                // though they might be stale for the filtered view.
                aiInsights: rawData.statistics.aiInsights,
                // jdaHierarchy is now calculated in analyzeWorkflowData, so we don't need to preserve rawData's version
                // This allows dashboards to reflect filters!
            },
            workflowSteps: filteredSteps
        };

    }, [rawData, filters]);

    return (
        <ProjectContext.Provider
            value={{
                projects,
                currentProject,
                loading,
                error,
                filters,
                setFilters,
                uploadCSV,
                selectProject,
                refreshProjects,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};
