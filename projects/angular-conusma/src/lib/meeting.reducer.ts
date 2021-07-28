import { InjectionToken } from '@angular/core';
import { Action, ActionReducer, createReducer, on, INIT, UPDATE } from '@ngrx/store';
import { updateMeetingUser } from './meeting.actions';
import { MeetingUserModel } from './Models/meeting-user-model';

export const initialState:MeetingUserModel = new MeetingUserModel();
 
const _meetingReducer = createReducer(
  initialState,
  on(updateMeetingUser, (state, { meetingUser }) => ({ ...state, meetingUser })),
);
export const ROOT_REDUCER = new InjectionToken<any>('Root Reducer', {factory: () => ({meetingUser: meetingReducer})});

export function meetingReducer(state:any, action:any) {
  return _meetingReducer(state, action);
}