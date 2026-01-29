import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Smartphone, Shield, Info } from 'lucide-react';

export function CameraPermissionsGuide() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Camera Access Guide
        </CardTitle>
        <CardDescription>
          How to enable camera permissions for sleep analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Why Camera Access is Needed</AlertTitle>
          <AlertDescription>
            Our sleep deprivation analysis uses your device camera to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Face Analysis:</strong> Detect eye openness, blink rate, and facial tension</li>
              <li><strong>HRV Monitoring:</strong> Measure heart rate variability through fingertip blood flow</li>
            </ul>
            All analysis is performed locally on your device. No images or videos are stored or transmitted.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Browser Permission Steps
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="font-medium mb-1">Chrome / Edge (Desktop & Mobile)</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click the camera icon in the address bar</li>
                <li>Select "Always allow" for camera access</li>
                <li>Click "Done" and refresh the page</li>
              </ol>
            </div>

            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="font-medium mb-1">Safari (Desktop)</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to Safari → Settings → Websites → Camera</li>
                <li>Find this website and select "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>

            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="font-medium mb-1">Safari (iOS)</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to Settings → Safari → Camera</li>
                <li>Select "Ask" or "Allow"</li>
                <li>Return to the app and grant permission when prompted</li>
              </ol>
            </div>

            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="font-medium mb-1">Firefox</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click the camera icon in the address bar</li>
                <li>Remove any blocks and select "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          </div>
        </div>

        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertTitle>Mobile Device Requirements</AlertTitle>
          <AlertDescription>
            <strong>For HRV Monitoring:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Requires a smartphone or tablet with rear camera</li>
              <li>Flash/torch capability recommended for best results</li>
              <li>Works on both iOS and Android devices</li>
            </ul>
            <br />
            <strong>For Face Analysis:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Works on any device with a front-facing camera</li>
              <li>Desktop, laptop, tablet, or smartphone</li>
              <li>Good lighting recommended for accurate results</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Troubleshooting Tips</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ensure you're using HTTPS (secure connection)</li>
            <li>• Check that no other app is using the camera</li>
            <li>• Try closing and reopening your browser</li>
            <li>• Clear browser cache and cookies if issues persist</li>
            <li>• Update your browser to the latest version</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
