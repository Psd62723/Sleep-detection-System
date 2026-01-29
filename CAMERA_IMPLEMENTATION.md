# Camera Access Implementation - Sleep Deprivation Analysis System

## Overview
Enhanced camera access functionality with comprehensive error handling, user guidance, and browser compatibility checks for both Face Analysis and HRV Monitoring features.

## Key Improvements

### 1. Enhanced Error Handling
- **Browser Compatibility Check**: Detects if `navigator.mediaDevices` API is supported
- **Secure Context Validation**: Ensures HTTPS or localhost for camera access
- **Detailed Error Messages**: Provides specific guidance for different error types:
  - `NotAllowedError`: Permission denied - guides user to enable in browser settings
  - `NotFoundError`: No camera detected - suggests connecting a camera device
  - `NotReadableError`: Camera in use - advises closing other applications
  - `OverconstrainedError`: Camera specs not met - suggests trying different device
  - `SecurityError`: Security restrictions - directs to browser settings

### 2. Improved Camera Configuration
- **Face Analysis**: 
  - Front-facing camera (user mode)
  - Ideal resolution: 1280x720
  - Optimized for facial feature detection
  
- **HRV Monitoring**:
  - Rear-facing camera (environment mode)
  - Ideal resolution: 1280x720
  - Flash/torch enabled when available
  - Graceful fallback if flash not supported

### 3. User Guidance Components

#### Camera Permissions Guide
New comprehensive guide component (`CameraPermissionsGuide.tsx`) includes:
- **Why Camera Access is Needed**: Explains privacy and local processing
- **Browser-Specific Instructions**:
  - Chrome/Edge (Desktop & Mobile)
  - Safari (Desktop & iOS)
  - Firefox
- **Device Requirements**: 
  - Mobile requirements for HRV monitoring
  - Desktop/laptop compatibility for face analysis
- **Troubleshooting Tips**: Common issues and solutions

#### Enhanced In-Component Instructions
- **Face Analysis**: Step-by-step camera enable instructions with visual alerts
- **HRV Monitor**: Detailed finger placement and permission guidance

### 4. User Experience Enhancements
- **Help Button**: Added "Camera Help" button on Analysis page
- **Modal Dialog**: Camera permissions guide accessible via dialog
- **Clear Visual Feedback**: Alert messages with icons and structured lists
- **Mobile Detection**: Automatic device type detection for HRV feature

## Technical Implementation

### Error Handling Pattern
```typescript
try {
  // Check browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera API not supported');
  }
  
  // Check secure context
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    throw new Error('HTTPS required');
  }
  
  // Request camera access
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
} catch (err: unknown) {
  // Detailed error handling with user-friendly messages
  if (err instanceof Error) {
    switch (err.name) {
      case 'NotAllowedError': // Permission denied
      case 'NotFoundError': // No camera
      case 'NotReadableError': // Camera in use
      // ... handle each case
    }
  }
}
```

### Camera Constraints
```typescript
// Face Analysis
{
  video: { 
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: false
}

// HRV Monitoring
{
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: false
}
```

## Security & Privacy

### Local Processing
- All camera analysis performed locally on device
- No images or videos stored or transmitted
- Camera stream stopped immediately after analysis

### Secure Context Requirement
- HTTPS enforced for production environments
- Localhost allowed for development
- Clear error messages if accessed via HTTP

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Opera
- ✅ Samsung Internet

### Required Features
- `navigator.mediaDevices.getUserMedia()`
- MediaStream API
- Video element support
- Optional: Torch/Flash API (for HRV on mobile)

## User Instructions

### For Face Analysis
1. Click "Start Camera" button
2. Allow camera permission when prompted
3. Position face in camera frame
4. Click "Analyze Now" to begin analysis

### For HRV Monitoring (Mobile Only)
1. Ensure using a mobile device
2. Click "Start HRV Monitoring" button
3. Allow camera permission when prompted
4. Place finger over rear camera and flash
5. Keep still for 30 seconds during measurement

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check browser address bar for camera icon, enable access
2. **Camera Not Found**: Ensure device has camera, check hardware connections
3. **Camera In Use**: Close other apps using camera (Zoom, Skype, etc.)
4. **HTTPS Required**: Access site via HTTPS or localhost
5. **Browser Not Supported**: Update to latest browser version

### Developer Notes
- Test on actual mobile devices for HRV feature
- Verify HTTPS in production environment
- Monitor console for detailed error logs
- Consider adding camera preview before analysis

## Future Enhancements
- [ ] Add camera preview with face detection overlay
- [ ] Implement real-time fatigue indicators during analysis
- [ ] Add option to switch between front/rear cameras
- [ ] Support for multiple camera devices selection
- [ ] Add camera quality check before analysis
- [ ] Implement progressive web app (PWA) for better mobile experience
