import { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
          <Card className="w-full max-w-sm border-border shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="text-4xl">😕</span>
              <div className="space-y-1">
                <h2 className="text-lg font-bold">משהו השתבש</h2>
                <p className="text-sm text-muted-foreground">אירעה שגיאה בלתי צפויה</p>
              </div>
              <Button onClick={() => window.location.reload()}>רענן דף</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
