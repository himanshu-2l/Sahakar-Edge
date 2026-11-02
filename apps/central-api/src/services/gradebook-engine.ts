/**
 * Sahakar Edge — Continuous Evaluation, Marks Tally & Gradebook Engine
 * 
 * Separates formative quizzes from summative tests, compiles cumulative
 * course gradebooks, and generates statutory multi-sheet multilingual reports.
 */

import type {
  AssessmentType,
  AcademicGrade,
  CourseModuleTest,
  TraineeMarksRecord,
  CourseMarksTally,
  CourseGradebookRow,
  CourseGradebookMatrix,
} from '@sahakar/types';

export interface TraineeAssessmentSubmission {
  id: string;
  testId: string;
  traineeId: string;
  marksObtained: number;
  totalMarks: number;
  submittedAt: string;
}

export interface InstitutionalGradebook extends CourseGradebookMatrix {
  instituteName?: string;
  compiledAt?: string;
  summativeTests?: Array<{ id: string; title: string; totalMarks: number; passMarks: number }>;
  totalTrainees?: number;
}

export class GradebookEngine {
  /**
   * Evaluates a single test submission, handling formative vs summative rules.
   */
  public evaluateSubmission(
    test: CourseModuleTest,
    currentAttemptsCount: number,
    rawMarksObtained: number
  ): { allowed: boolean; passed: boolean; percentage: number; rejectionReason?: string } {
    if (test.type === 'SUMMATIVE_TEST' && test.maxAttempts > 0 && currentAttemptsCount >= test.maxAttempts) {
      return {
        allowed: false,
        passed: false,
        percentage: 0,
        rejectionReason: `Maximum permitted test attempts reached (${currentAttemptsCount}/${test.maxAttempts}). Retakes are locked.`,
      };
    }

    const marks = Math.max(0, Math.min(rawMarksObtained, test.totalMarks));
    const percentage = test.totalMarks > 0 ? Math.round((marks / test.totalMarks) * 10000) / 100 : 0.0;
    const passed = marks >= test.passMarks;

    return {
      allowed: true,
      passed,
      percentage,
    };
  }

  /**
   * Computes the personal cumulative Course Marks Tally for a trainee.
   */
  public computeTraineeMarksTally(params: {
    traineeId: string;
    traineeName: string;
    courseId: string;
    courseTitle: string;
    tests: CourseModuleTest[];
    submissions: TraineeAssessmentSubmission[];
    completedLessonsCount: number;
    totalLessonsCount: number;
  }): CourseMarksTally {
    const {
      traineeId,
      traineeName,
      courseId,
      courseTitle,
      tests,
      submissions,
      completedLessonsCount,
      totalLessonsCount,
    } = params;

    let formativeCount = 0;
    let summativePassCount = 0;
    let summativeTotalCount = 0;
    let cumulativeMarksObtained = 0;
    let cumulativeTotalMarks = 0;

    const records: TraineeMarksRecord[] = tests.map((test) => {
      const testSubmissions = submissions.filter((s) => s.testId === test.id && s.traineeId === traineeId);
      const attemptsUsed = testSubmissions.length;
      const bestScore = testSubmissions.length > 0
        ? Math.max(...testSubmissions.map((s) => s.marksObtained))
        : 0;

      const percentage = test.totalMarks > 0 ? Math.round((bestScore / test.totalMarks) * 10000) / 100 : 0.0;
      const passed = bestScore >= test.passMarks;
      const contributesToTally = test.type === 'SUMMATIVE_TEST';

      let lastAttemptedAt: string | undefined;
      if (testSubmissions.length > 0) {
        lastAttemptedAt = testSubmissions[testSubmissions.length - 1].submittedAt;
      }

      if (test.type === 'FORMATIVE_QUIZ') {
        if (attemptsUsed > 0) formativeCount++;
      } else {
        summativeTotalCount++;
        if (passed) summativePassCount++;
        cumulativeMarksObtained += bestScore;
        cumulativeTotalMarks += test.totalMarks;
      }

      return {
        testId: test.id,
        testTitle: test.title,
        type: test.type,
        attemptsUsed,
        bestScore,
        totalMarks: test.totalMarks,
        percentage,
        passed,
        lastAttemptedAt,
        contributesToTally,
      };
    });

    const overallPercentage =
      cumulativeTotalMarks > 0 ? Math.round((cumulativeMarksObtained / cumulativeTotalMarks) * 10000) / 100 : 0.0;

    const lessonCompletionPercent =
      totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 10000) / 100 : 100.0;

    // Certificate eligibility requires 100% lessons completed AND passing every summative test
    const allSummativePassed = summativeTotalCount > 0 && summativePassCount === summativeTotalCount;
    const allLessonsCompleted = completedLessonsCount >= totalLessonsCount;
    const certificateEligible = allSummativePassed && allLessonsCompleted;

    let awardGrade: AcademicGrade = 'INCOMPLETE';
    if (allSummativePassed) {
      if (overallPercentage >= 85.0) awardGrade = 'DISTINCTION';
      else if (overallPercentage >= 70.0) awardGrade = 'FIRST_CLASS';
      else if (overallPercentage >= 60.0) awardGrade = 'PASS';
      else awardGrade = 'INCOMPLETE';
    }

    return {
      traineeId,
      traineeName,
      courseId,
      courseTitle,
      completedLessonsCount,
      totalLessonsCount,
      lessonCompletionPercent,
      formativeQuizzesAttempted: formativeCount,
      summativeTestsPassed: summativePassCount,
      totalSummativeTests: summativeTotalCount,
      cumulativeMarksObtained,
      cumulativeTotalMarks,
      overallPercentage,
      awardGrade,
      certificateEligible,
      records,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compiles the institutional cohort Gradebook matrix.
   */
  public compileInstitutionalGradebook(params: {
    courseId: string;
    courseTitle: string;
    instituteName: string;
    tests: CourseModuleTest[];
    trainees: Array<{ id: string; name: string; cooperativeAffiliation: string; completedLessons: number }>;
    submissions: TraineeAssessmentSubmission[];
    totalLessonsCount: number;
    programmeId?: string;
    programmeTitle?: string;
  }): InstitutionalGradebook {
    const {
      courseId,
      courseTitle,
      instituteName,
      tests,
      trainees,
      submissions,
      totalLessonsCount,
      programmeId,
      programmeTitle,
    } = params;

    const summativeTests = tests.filter((t) => t.type === 'SUMMATIVE_TEST');

    let totalPctSum = 0;
    let certifiedCount = 0;

    const rows: CourseGradebookRow[] = trainees.map((trainee) => {
      const tally = this.computeTraineeMarksTally({
        traineeId: trainee.id,
        traineeName: trainee.name,
        courseId,
        courseTitle,
        tests,
        submissions,
        completedLessonsCount: trainee.completedLessons,
        totalLessonsCount,
      });

      const scoresByTestId: CourseGradebookRow['scoresByTestId'] = {};
      for (const rec of tally.records.filter((r) => r.type === 'SUMMATIVE_TEST')) {
        scoresByTestId[rec.testId] = {
          score: rec.bestScore,
          total: rec.totalMarks,
          passed: rec.passed,
          attempts: rec.attemptsUsed,
        };
      }

      totalPctSum += tally.overallPercentage;
      if (tally.certificateEligible) certifiedCount++;

      return {
        traineeId: trainee.id,
        traineeName: trainee.name,
        cooperativeAffiliation: trainee.cooperativeAffiliation,
        scoresByTestId,
        cumulativeMarks: tally.cumulativeMarksObtained,
        cumulativeTotal: tally.cumulativeTotalMarks,
        overallPercentage: tally.overallPercentage,
        passedAllSummative: tally.summativeTestsPassed === tally.totalSummativeTests,
        grade: tally.awardGrade || 'INCOMPLETE',
        certificateIssued: tally.certificateEligible,
        certificateCode: tally.certificateEligible ? `CERT-${courseId.substring(0, 8)}-${trainee.id.substring(0, 6)}` : undefined,
      };
    });

    const totalTrainees = trainees.length;
    const classAveragePercentage =
      totalTrainees > 0 ? Math.round((totalPctSum / totalTrainees) * 100) / 100 : 0.0;
    const passRatePercentage =
      totalTrainees > 0 ? Math.round((certifiedCount / totalTrainees) * 10000) / 100 : 0.0;

    return {
      courseId,
      courseTitle,
      programmeId,
      programmeTitle,
      instituteName,
      compiledAt: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      summativeTests: summativeTests.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        totalMarks: t.totalMarks,
        passMarks: t.passMarks,
      })),
      tests: summativeTests.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        totalMarks: t.totalMarks,
        passMarks: t.passMarks,
      })),
      rows,
      totalTrainees,
      totalEnrolled: totalTrainees,
      classAveragePercentage,
      passRatePercentage,
    };
  }

  /**
   * Generates formatted statutory CSV/XLSX text with authentic English and Hindi Devanagari headers.
   */
  public generateStatutoryExportCsv(gradebook: InstitutionalGradebook): {
    summaryCsv: string;
    traineeMatrixCsv: string;
  } {
    // 1. Institutional Summary Sheet (संस्थान प्रदर्शन सारांश)
    const instituteName = gradebook.instituteName || 'National Council for Cooperative Training (NCCT)';
    const summaryLines: string[] = [
      '# NATIONAL COUNCIL FOR COOPERATIVE TRAINING (NCCT) — STATUTORY ACADEMIC REGISTER',
      '# राष्ट्रीय सहकारी प्रशिक्षण परिषद (एनसीसीटी) — संविधिक शैक्षणिक पंजी',
      `Institute / संस्थान,"${instituteName}"`,
      `Course Title / पाठ्यक्रम शीर्षक,"${gradebook.courseTitle}"`,
      `Course Code / पाठ्यक्रम कोड,"${gradebook.courseId}"`,
      `Date Compiled / संकलन दिनांक,"${gradebook.compiledAt || gradebook.generatedAt}"`,
      `Total Enrolled Trainees / कुल नामांकित प्रशिक्षार्थी,${gradebook.totalTrainees || gradebook.totalEnrolled || 0}`,
      `Class Average Percentage / कक्षा औसत प्रतिशत,${gradebook.classAveragePercentage.toFixed(2)}%`,
      `Pass Rate / उत्तीर्णता दर,${gradebook.passRatePercentage.toFixed(2)}%`,
      `Summative Modules Evaluated / मूल्यांकित योगात्मक मॉड्यूल,${gradebook.tests.length}`,
    ];

    // 2. Trainee Performance Matrix Sheet (प्रशिक्षार्थी प्राप्तांक तालिका)
    const headerCols = [
      'Trainee ID / प्रशिक्षार्थी क्रमांक',
      'Full Name / पूरा नाम',
      'Cooperative Society / सहकारी संस्था',
      ...gradebook.tests.map((t) => `"${t.title} (Max ${t.totalMarks})"`),
      'Marks Obtained / कुल प्राप्तांक',
      'Max Marks / पूर्णांक',
      'Percentage / प्रतिशत',
      'Grade / श्रेणी',
      'Certified / प्रमाणन पात्र',
    ];

    const dataLines: string[] = [headerCols.join(',')];

    for (const row of gradebook.rows) {
      const testCols = gradebook.tests.map((t) => {
        const sc = row.scoresByTestId[t.id];
        return sc ? String(sc.score) : '0';
      });

      const lineCols = [
        `"${row.traineeId}"`,
        `"${row.traineeName}"`,
        `"${row.cooperativeAffiliation || ''}"`,
        ...testCols,
        String(row.cumulativeMarks),
        String(row.cumulativeTotal),
        `${row.overallPercentage.toFixed(2)}%`,
        `"${row.grade}"`,
        row.certificateIssued ? 'YES / हाँ' : 'NO / नहीं',
      ];
      dataLines.push(lineCols.join(','));
    }

    return {
      summaryCsv: summaryLines.join('\n'),
      traineeMatrixCsv: dataLines.join('\n'),
    };
  }
}

export const gradebookEngine = new GradebookEngine();
