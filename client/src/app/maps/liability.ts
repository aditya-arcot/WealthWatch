import {
    StudentLoanRepaymentPlanTypeEnum,
    StudentLoanStatusTypeEnum,
} from 'wealthwatch-shared'

export const studentLoanStatusTypeNameMap: Record<
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
    [StudentLoanStatusTypeEnum.PendingIdr]: 'Pending IDR',
    [StudentLoanStatusTypeEnum.Other]: 'Other',
}

export const studentLoanRepaymentPlanTypeNameMap: Record<
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
    [StudentLoanRepaymentPlanTypeEnum.SavingOnValuableEducation]: 'SAVE',
    [StudentLoanRepaymentPlanTypeEnum.Other]: 'Other',
}
