export enum StudentLoanStatusTypeEnum {
    Cancelled = 1,
    ChargedOff,
    Claim,
    Consolidated,
    Deferment,
    Delinquent,
    Discharged,
    Extension,
    Forbearance,
    InGrace,
    InMilitary,
    InSchool,
    NotFullyDisbursed,
    PaidInFull,
    Refunded,
    Repayment,
    Transferred,
    PendingIDR,
    Other,
}

export enum StudentLoanRepaymentPlanTypeEnum {
    Graduated = 1,
    Standard,
    ExtendedGraduated,
    ExtendedStandard,
    IncomeContingentRepayment,
    IncomeBasedRepayment,
    IncomeSensitiveRepayment,
    InterestOnly,
    PayAsYouEarn,
    RevisedPayAsYouEarn,
    SavingOnAValuableEducation,
    Other,
}

export const studentLoanStatusTypeNames: Record<
    StudentLoanStatusTypeEnum,
    string
> = {
    [StudentLoanStatusTypeEnum.Cancelled]: 'Cancelled',
    [StudentLoanStatusTypeEnum.ChargedOff]: 'Charged Off',
    [StudentLoanStatusTypeEnum.Claim]: 'Claim',
    [StudentLoanStatusTypeEnum.Consolidated]: 'Consolidated',
    [StudentLoanStatusTypeEnum.Deferment]: 'Deferment',
    [StudentLoanStatusTypeEnum.Delinquent]: 'Delinquent',
    [StudentLoanStatusTypeEnum.Discharged]: 'Discharged',
    [StudentLoanStatusTypeEnum.Extension]: 'Extension',
    [StudentLoanStatusTypeEnum.Forbearance]: 'Forbearance',
    [StudentLoanStatusTypeEnum.InGrace]: 'In Grace',
    [StudentLoanStatusTypeEnum.InMilitary]: 'In Military',
    [StudentLoanStatusTypeEnum.InSchool]: 'In School',
    [StudentLoanStatusTypeEnum.NotFullyDisbursed]: 'Not Fully Disbursed',
    [StudentLoanStatusTypeEnum.PaidInFull]: 'Paid In Full',
    [StudentLoanStatusTypeEnum.Refunded]: 'Refunded',
    [StudentLoanStatusTypeEnum.Repayment]: 'Repayment',
    [StudentLoanStatusTypeEnum.Transferred]: 'Transferred',
    [StudentLoanStatusTypeEnum.PendingIDR]: 'Pending IDR',
    [StudentLoanStatusTypeEnum.Other]: 'Other',
}

export const studentLoanRepaymentPlanTypeNames: Record<
    StudentLoanRepaymentPlanTypeEnum,
    string
> = {
    [StudentLoanRepaymentPlanTypeEnum.Graduated]: 'Graduated',
    [StudentLoanRepaymentPlanTypeEnum.Standard]: 'Standard',
    [StudentLoanRepaymentPlanTypeEnum.ExtendedGraduated]: 'Extended Graduated',
    [StudentLoanRepaymentPlanTypeEnum.ExtendedStandard]: 'Extended Standard',
    [StudentLoanRepaymentPlanTypeEnum.IncomeContingentRepayment]: 'ICR',
    [StudentLoanRepaymentPlanTypeEnum.IncomeBasedRepayment]: 'IBR',
    [StudentLoanRepaymentPlanTypeEnum.IncomeSensitiveRepayment]: 'ISR',
    [StudentLoanRepaymentPlanTypeEnum.InterestOnly]: 'Interest Only',
    [StudentLoanRepaymentPlanTypeEnum.PayAsYouEarn]: 'PAYE',
    [StudentLoanRepaymentPlanTypeEnum.RevisedPayAsYouEarn]: 'REPAYE',
    [StudentLoanRepaymentPlanTypeEnum.SavingOnAValuableEducation]: 'SAVE',
    [StudentLoanRepaymentPlanTypeEnum.Other]: 'Other',
}
