import * as Yup from 'yup';

export const TierSchema = Yup.object({
  name: Yup.string().trim().required('Required'),
  points: Yup.number().min(0).max(9999999).required('Required'),
  requiredDirectDownlines: Yup.number().min(0).max(9999).required('Required'),
  weeklyOrderQuota: Yup.number().min(0).max(9999).nullable(),
});
