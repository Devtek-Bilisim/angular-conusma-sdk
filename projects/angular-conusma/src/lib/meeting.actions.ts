import { createAction, props } from '@ngrx/store';
import { MeetingUserModel } from './Models/meeting-user-model';

export const updateMeetingUser = createAction('[MeetingUserModel] update', props<{ meetingUserModel:MeetingUserModel }>());