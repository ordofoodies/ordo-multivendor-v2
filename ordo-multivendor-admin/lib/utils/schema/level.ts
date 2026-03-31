import * as Yup from 'yup';
import { IDropdownSelectItem } from '../interfaces';

export const CustomerLevelSchema = Yup.object({
  type: Yup.mixed<IDropdownSelectItem>().required('Required'),
  value: Yup.number().min(0).max(999999).required('Required'),
});
export const DriverLevelSchema = Yup.object({
  type: Yup.mixed<IDropdownSelectItem>().required('Required'),
  value: Yup.number().min(0).max(999999).required('Required'),
});
export const OrderLevelSchema = Yup.object({
  type: Yup.mixed<IDropdownSelectItem>().required('Required'),
  value: Yup.number().min(0).max(999999).required('Required'),
  completionWindow: Yup.mixed<IDropdownSelectItem>().required('Required'),
  requiredCompletedOrders: Yup.number().min(1).integer().required('Required'),
});
