import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { SendHorizontalIcon } from "lucide-react";
import type { FC } from "react";

import { TooltipIconButton } from "~/components/ui/assistant-ui/tooltip-icon-button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { MarkdownText } from "./markdown-text";

export const MyThread: FC = () => {
  return (
    <ThreadPrimitive.Root className="bg-surface h-full">
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center bg-inherit px-8 pt-8">
        <ThreadPrimitive.Messages
          components={{
            UserMessage: MyUserMessage,
            AssistantMessage: MyAssistantMessage,
          }}
        />

        <div className="min-h-8 flex-grow" />

        <div className="sticky bottom-0 mt-3 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <MyComposer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const MyThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex flex-grow flex-col items-center justify-center">
        <Avatar>
          <AvatarFallback>C</AvatarFallback>
        </Avatar>
        <p className="mt-4 font-medium">How can I help you today?</p>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const MyComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-aui-ring/20 flex w-full items-center rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
      <ComposerPrimitive.Input
        placeholder="Write a message..."
        rows={1}
        className="placeholder:text-muted-foreground size-full max-h-40 resize-none border-none bg-transparent p-4 pr-12 outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerPrimitive.Send asChild>
        <TooltipIconButton
          tooltip="Send"
          variant="default"
          className="my-2.5 size-8 p-2 transition-opacity ease-in"
        >
          <SendHorizontalIcon />
        </TooltipIconButton>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
};

const MyUserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid w-full auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
      <div className="bg-muted text-foreground col-start-2 row-start-1 break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>
    </MessagePrimitive.Root>
  );
};

const MyAssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative grid w-full grid-cols-[auto_1fr] grid-rows-[auto_1fr] py-4">
      <Avatar className="col-start-1 row-span-full row-start-1 mr-4">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="text-foreground col-start-2 row-start-1 break-words leading-7">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>
    </MessagePrimitive.Root>
  );
};
