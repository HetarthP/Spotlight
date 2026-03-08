import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

export default async function ChatPage() {
    // Gate behind Auth0 login — redirect to login if no session
    const session = await auth0.getSession();
    if (!session) {
        redirect("/auth/login?returnTo=/brand/chat");
    }

    return (
        <div className="pt-24 h-screen w-full">
            <AnimatedAIChat />
        </div>
    );
}
