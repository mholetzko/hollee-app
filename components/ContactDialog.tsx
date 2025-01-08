'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ContactDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ isOpen, onOpenChange }: ContactDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-black/95 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Get in Touch
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-gray-300 mt-4">
          <p>
            Have something to share? I'd love to hear from you! Reach out at:
          </p>
          
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <a 
              href="mailto:contact@holleerides.com"
              className="text-white hover:text-[#1DB954] transition-colors"
            >
              contact@holleerides.com
            </a>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-white">Feel free to send:</p>
            <ul className="space-y-2 ml-5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                Feature requests and ideas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                Problem descriptions or bug reports
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                Questions about the application
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                Praise and constructive feedback 😊
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-400 italic">
            I'll do my best to respond to all messages, though it might take a few days.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 