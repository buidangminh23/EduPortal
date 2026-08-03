import { describe, it, expect } from 'vitest';
import { cameraAccess, showsCameraTab, CAMERA_DENIAL } from './cameraAccess';
import { APP_MODE } from '../appMode';

const real = { appMode: APP_MODE.REAL, serverUrl: 'http://10.0.0.2:8080' };

describe('cameraAccess', () => {
  it('lets Ban Giám Hiệu in on a real deployment with a server', () => {
    expect(cameraAccess({ role: 'admin', ...real })).toEqual({ allowed: true, reason: null });
  });

  it('keeps everybody else out, whatever the deployment', () => {
    for (const role of ['teacher', 'teacher_subject', 'teacher_homeroom', 'student', 'parent', '', undefined]) {
      expect(cameraAccess({ role, ...real })).toEqual({ allowed: false, reason: CAMERA_DENIAL.ROLE });
    }
  });

  it('refuses a demo build even for Ban Giám Hiệu — anybody can pick that role there', () => {
    expect(cameraAccess({ role: 'admin', ...real, appMode: APP_MODE.DEMO }))
      .toEqual({ allowed: false, reason: CAMERA_DENIAL.DEMO });
  });

  it('blames the demo, not the account, when both would refuse', () => {
    // On a demo the role is a costume, so "you are not the head teacher" is
    // the wrong thing to tell somebody standing in front of the screen.
    expect(cameraAccess({ role: 'student', ...real, appMode: APP_MODE.DEMO }).reason)
      .toBe(CAMERA_DENIAL.DEMO);
  });

  it('refuses a build that cannot say whether it is real', () => {
    expect(cameraAccess({ role: 'admin', ...real, appMode: APP_MODE.UNCONFIGURED }))
      .toEqual({ allowed: false, reason: CAMERA_DENIAL.UNCONFIGURED });
  });

  it('says the server address is missing rather than failing silently', () => {
    expect(cameraAccess({ role: 'admin', ...real, serverUrl: '' }))
      .toEqual({ allowed: false, reason: CAMERA_DENIAL.NO_SERVER });
  });
});

describe('showsCameraTab', () => {
  it('puts the menu entry in front of Ban Giám Hiệu only', () => {
    expect(showsCameraTab('admin')).toBe(true);
    for (const role of ['teacher', 'student', 'parent', undefined]) {
      expect(showsCameraTab(role)).toBe(false);
    }
  });
});
