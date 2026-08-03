import { describe, it, expect } from 'vitest';
import { parseCameraRegistry, publicView, findCamera } from './cameraRegistry.js';

const entry = (over = {}) => ({
  id: 'san-truong',
  name: 'Sân trường',
  location: 'Khu A',
  source: 'rtsp://user:pass@192.168.1.64:554/Streaming/Channels/101',
  ...over
});

describe('parseCameraRegistry', () => {
  it('accepts both a bare array and a { cameras: [...] } file', () => {
    expect(parseCameraRegistry([entry()])).toHaveLength(1);
    expect(parseCameraRegistry({ cameras: [entry()] })).toHaveLength(1);
  });

  it('gives each camera its own relay path', () => {
    const [first, second] = parseCameraRegistry([entry(), entry({ id: 'cong-chinh', name: 'Cổng chính' })]);

    expect(first.streamPath).toBe('cam-san-truong');
    expect(second.streamPath).toBe('cam-cong-chinh');
  });

  it('treats a camera as enabled unless it says otherwise', () => {
    expect(parseCameraRegistry([entry()])[0].enabled).toBe(true);
    expect(parseCameraRegistry([entry({ enabled: false })])[0].enabled).toBe(false);
  });

  it('refuses a duplicate id instead of hiding one camera behind another', () => {
    expect(() => parseCameraRegistry([entry(), entry()])).toThrow(/trùng id/);
  });

  it('refuses an entry with no address, rather than listing a camera that cannot play', () => {
    expect(() => parseCameraRegistry([entry({ source: '' })])).toThrow(/source/);
  });

  it('refuses an id that would not survive being put in a URL', () => {
    for (const id of ['Sân Trường', 'san truong', '', 'san/truong']) {
      expect(() => parseCameraRegistry([entry({ id })])).toThrow();
    }
  });
});

describe('publicView', () => {
  it('never carries the stream address', () => {
    const [camera] = parseCameraRegistry([entry()]);
    const view = publicView(camera);

    expect(view).toEqual({
      id: 'san-truong',
      name: 'Sân trường',
      location: 'Khu A',
      streamPath: 'cam-san-truong'
    });
    expect(JSON.stringify(view)).not.toContain('rtsp');
    expect(JSON.stringify(view)).not.toContain('pass');
  });
});

describe('findCamera', () => {
  it('does not hand back a camera the school switched off', () => {
    const cameras = parseCameraRegistry([entry({ enabled: false })]);

    expect(findCamera(cameras, 'san-truong')).toBeNull();
  });
});
