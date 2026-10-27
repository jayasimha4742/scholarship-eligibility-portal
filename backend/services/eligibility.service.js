/**
 * Scholarship Eligibility Evaluation Service
 * Evaluates student profile against scholarship-specific criteria.
 * 
 * College Academic Project: Scholarship Eligibility Portal
 */

class EligibilityService {
  /**
   * Evaluate a student's profile against an array of scholarships
   * @param {Object} studentProfile - Form input from student
   * @param {Array} scholarships - List of scholarships
   * @returns {Array} List of evaluated scholarships with status and match breakdown
   */
  evaluateAll(studentProfile, scholarships) {
    if (!studentProfile) {
      throw new Error('Student profile data is required');
    }

    const evaluatedResults = scholarships.map((scholarship) => {
      const evaluation = this.evaluateSingle(studentProfile, scholarship);
      return {
        scholarship,
        ...evaluation
      };
    });

    // Sort order: "Meets Listed Criteria" first, then "May Be Eligible", then "Not Eligible Under Listed Rules"
    const priority = {
      'Meets Listed Criteria': 1,
      'May Be Eligible': 2,
      'Not Eligible Under Listed Rules': 3
    };

    return evaluatedResults.sort((a, b) => {
      const pDiff = (priority[a.status] || 99) - (priority[b.status] || 99);
      if (pDiff !== 0) return pDiff;
      // Secondary sort: higher match score first
      return b.matchScore - a.matchScore;
    });
  }

  /**
   * Evaluate a student against a single scholarship
   * @param {Object} student 
   * @param {Object} scholarship 
   * @returns {Object} evaluation details
   */
  evaluateSingle(student, scholarship) {
    const checks = [];
    let isEligible = true;
    let isBorderline = false;
    let passedCount = 0;
    let totalRules = 0;

    // 1. Education Level Check
    totalRules++;
    const studentLevel = (student.educationLevel || '').trim().toLowerCase();
    const levels = (scholarship.educationLevels || []).map((l) => l.toLowerCase());
    const isLevelMatch = levels.includes('all') || levels.includes('any') || levels.some((l) => studentLevel.includes(l) || l.includes(studentLevel));

    if (isLevelMatch) {
      passedCount++;
      checks.push({
        criterion: 'Education Level',
        passed: true,
        detail: `Enrolled in "${student.educationLevel}", which matches the eligible levels: ${scholarship.educationLevels.join(', ')}.`
      });
    } else {
      isEligible = false;
      checks.push({
        criterion: 'Education Level',
        passed: false,
        detail: `Currently enrolled in "${student.educationLevel}". This scholarship requires: ${scholarship.educationLevels.join(', ')}.`
      });
    }

    // 2. Academic Marks (Percentage) Check
    totalRules++;
    const studentMarks = parseFloat(student.previousPercentage);
    const minMarks = scholarship.minimumPercentage || 0;

    if (!isNaN(studentMarks)) {
      if (studentMarks >= minMarks) {
        passedCount++;
        checks.push({
          criterion: 'Academic Performance',
          passed: true,
          detail: `Your score of ${studentMarks}% meets or exceeds the minimum required threshold of ${minMarks}%.`
        });
      } else if (studentMarks >= minMarks - 3) {
        // Within 3% tolerance - might qualify under category relaxation
        isBorderline = true;
        checks.push({
          criterion: 'Academic Performance',
          passed: false,
          isBorderline: true,
          detail: `Your score of ${studentMarks}% is slightly below the general ${minMarks}% cutoff. Certain state/reserved category relaxations may apply upon official review.`
        });
      } else {
        isEligible = false;
        checks.push({
          criterion: 'Academic Performance',
          passed: false,
          detail: `Your score of ${studentMarks}% is below the mandatory minimum of ${minMarks}%.`
        });
      }
    } else {
      isBorderline = true;
      checks.push({
        criterion: 'Academic Performance',
        passed: false,
        detail: `Marks not specified. Mandatory requirement is ${minMarks}%.`
      });
    }

    // 3. Annual Family Income Check
    totalRules++;
    const studentIncome = parseFloat(student.annualFamilyIncome);
    const maxIncome = scholarship.maximumFamilyIncome;

    if (maxIncome === null || maxIncome === undefined || maxIncome === 0) {
      // No income cap (e.g. purely merit-based)
      passedCount++;
      checks.push({
        criterion: 'Family Income',
        passed: true,
        detail: 'No family income limit specified for this scheme (Purely merit or general qualification).'
      });
    } else if (!isNaN(studentIncome)) {
      if (studentIncome <= maxIncome) {
        passedCount++;
        checks.push({
          criterion: 'Family Income',
          passed: true,
          detail: `Your reported annual family income (₹${studentIncome.toLocaleString('en-IN')}) is within the permissible ceiling of ₹${maxIncome.toLocaleString('en-IN')}.`
        });
      } else {
        isEligible = false;
        checks.push({
          criterion: 'Family Income',
          passed: false,
          detail: `Annual family income (₹${studentIncome.toLocaleString('en-IN')}) exceeds the maximum allowed ceiling of ₹${maxIncome.toLocaleString('en-IN')}.`
        });
      }
    } else {
      isBorderline = true;
      checks.push({
        criterion: 'Family Income',
        passed: false,
        detail: `Income not specified. Requires income below ₹${maxIncome.toLocaleString('en-IN')}.`
      });
    }

    // 4. State of Residence Check
    totalRules++;
    const studentState = (student.state || '').trim().toLowerCase();
    const eligibleStates = (scholarship.eligibleStates || []).map((s) => s.toLowerCase());
    const isAllIndia = eligibleStates.includes('all india') || eligibleStates.includes('all');
    const isStateMatch = isAllIndia || eligibleStates.some((s) => s.includes(studentState) || studentState.includes(s));

    if (isStateMatch) {
      passedCount++;
      checks.push({
        criterion: 'State of Residence',
        passed: true,
        detail: isAllIndia
          ? `Open to eligible students across All India (including ${student.state || 'your state'}).`
          : `Resident state "${student.state}" satisfies the domicile criteria (${scholarship.eligibleStates.join(', ')}).`
      });
    } else {
      isEligible = false;
      checks.push({
        criterion: 'State of Residence',
        passed: false,
        detail: `Resident state is "${student.state}". This scheme is restricted to residents of: ${scholarship.eligibleStates.join(', ')}.`
      });
    }

    // 5. Social Category Check
    totalRules++;
    const eligibleCats = scholarship.eligibleSocialCategories || [];
    const studentCat = (student.socialCategory || '').trim();

    if (eligibleCats.length === 0 || eligibleCats.includes('General') || eligibleCats.includes('All')) {
      passedCount++;
      checks.push({
        criterion: 'Social Category',
        passed: true,
        detail: `Open to all categories (${studentCat || 'General'} eligible).`
      });
    } else if (studentCat && eligibleCats.some((c) => c.toLowerCase() === studentCat.toLowerCase())) {
      passedCount++;
      checks.push({
        criterion: 'Social Category',
        passed: true,
        detail: `Category "${studentCat}" matches the designated beneficiary group (${eligibleCats.join(', ')}).`
      });
    } else {
      isEligible = false;
      checks.push({
        criterion: 'Social Category',
        passed: false,
        detail: `Selected category is "${studentCat || 'Not Specified'}". Scheme is reserved for: ${eligibleCats.join(', ')}.`
      });
    }

    // 6. Gender-Specific Criteria Check
    if (scholarship.genderSpecific && scholarship.genderSpecific !== 'All') {
      totalRules++;
      const studentGender = (student.gender || '').trim().toLowerCase();
      if (scholarship.genderSpecific.toLowerCase().includes('female')) {
        // If student specifies female, or not specified in basic form, we mark appropriately
        if (studentGender === 'female' || studentGender === 'girl') {
          passedCount++;
          checks.push({
            criterion: 'Gender / Special Quota',
            passed: true,
            detail: 'Exclusively designated for female students (Satisfied).'
          });
        } else if (!studentGender) {
          isBorderline = true;
          checks.push({
            criterion: 'Gender / Special Quota',
            passed: false,
            isBorderline: true,
            detail: 'Exclusively for female students. Verify gender eligibility before applying.'
          });
        } else {
          isEligible = false;
          checks.push({
            criterion: 'Gender / Special Quota',
            passed: false,
            detail: 'Designated exclusively for female applicants.'
          });
        }
      }
    }

    // 7. Disability Criteria Check
    if (scholarship.disabilityStatusRequired) {
      totalRules++;
      const hasDisability = student.disabilityStatus === 'Yes' || student.hasDisability === true;
      if (hasDisability) {
        passedCount++;
        checks.push({
          criterion: 'Disability Assistance Criteria',
          passed: true,
          detail: 'Requires valid disability certification (40% or above). Requirement satisfied.'
        });
      } else {
        isEligible = false;
        checks.push({
          criterion: 'Disability Assistance Criteria',
          passed: false,
          detail: 'Designated exclusively for specially-abled students with valid medical board certificate.'
        });
      }
    }

    // Determine final status
    let status = 'Not Eligible Under Listed Rules';
    if (isEligible && !isBorderline) {
      status = 'Meets Listed Criteria';
    } else if (isEligible && isBorderline) {
      status = 'May Be Eligible';
    } else if (!isEligible && isBorderline && passedCount >= Math.floor(totalRules / 2)) {
      status = 'May Be Eligible';
    }

    const matchedCriteria = checks.filter((c) => c.passed);
    const unmatchedCriteria = checks.filter((c) => !c.passed);
    const matchScore = Math.round((passedCount / totalRules) * 100);

    return {
      status,
      matchScore,
      totalRulesChecked: totalRules,
      rulesPassed: passedCount,
      checks,
      matchedCriteria,
      unmatchedCriteria,
      preliminaryNotice: 'Preliminary recommendation based on provided information. Final selection is subject to verification by official awarding authority.'
    };
  }
}

module.exports = new EligibilityService();

