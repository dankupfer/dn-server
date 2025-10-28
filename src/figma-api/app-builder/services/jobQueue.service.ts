// src/figma-api/app-builder/services/jobQueue.service.ts

export interface BuildJob {
    jobId: string;
    status: 'queued' | 'building' | 'complete' | 'error';
    progress: number;
    currentStep: string;
    result?: {
        prototypeUrl: string;
        buildTime: number;
    };
    error?: string;
    errorCode?: string;
    canRetry?: boolean;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

// In-memory job store
const jobs = new Map<string, BuildJob>();

/**
 * Create a new build job
 */
export function createJob(jobId: string): BuildJob {
    const job: BuildJob = {
        jobId,
        status: 'queued',
        progress: 0,
        currentStep: 'Initializing...',
        createdAt: new Date()
    };
    jobs.set(jobId, job);
    return job;
}

/**
 * Update an existing job
 */
export function updateJob(jobId: string, updates: Partial<BuildJob>): void {
    const job = jobs.get(jobId);
    if (job) {
        Object.assign(job, updates);
    }
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): BuildJob | undefined {
    return jobs.get(jobId);
}

/**
 * Mark job as started
 */
export function startJob(jobId: string): void {
    updateJob(jobId, {
        status: 'building',
        startedAt: new Date(),
        progress: 5,
        currentStep: 'Copying template...'
    });
}

/**
 * Mark job as complete
 */
export function completeJob(jobId: string, prototypeUrl: string, buildTime: number): void {
    updateJob(jobId, {
        status: 'complete',
        progress: 100,
        currentStep: 'Complete!',
        completedAt: new Date(),
        result: {
            prototypeUrl,
            buildTime
        }
    });
}

/**
 * Mark job as failed
 */
export function failJob(jobId: string, error: string, errorCode?: string, canRetry = true): void {
    updateJob(jobId, {
        status: 'error',
        currentStep: 'Failed',
        completedAt: new Date(),
        error,
        errorCode,
        canRetry
    });
}

/**
 * Update job progress
 */
export function updateProgress(jobId: string, progress: number, currentStep: string): void {
    updateJob(jobId, { progress, currentStep });
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs(): BuildJob[] {
    return Array.from(jobs.values());
}

/**
 * Clear completed/error jobs older than X minutes (future cleanup)
 */
export function clearOldJobs(maxAgeMinutes: number = 60): number {
    const now = new Date();
    let cleared = 0;

    jobs.forEach((job, jobId) => {
        if (job.status === 'complete' || job.status === 'error') {
            const age = now.getTime() - job.createdAt.getTime();
            if (age > maxAgeMinutes * 60 * 1000) {
                jobs.delete(jobId);
                cleared++;
            }
        }
    });

    return cleared;
}