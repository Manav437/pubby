import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Home,
    Users,
    Video,
    Share2,
    UserCircle,
    Cog,
    LogOut,
    Palette,
} from "lucide-react";

export function AppSidebar({
    roomId,
    onCopyLink,
}: {
    roomId: string;
    onCopyLink: () => void;
}) {
    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <h2 className="text-lg font-bold">Watch Party</h2>
                <p className="text-xs text-gray-500">
                    Room: {roomId.slice(0, 8)}...
                </p>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Room Actions</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={onCopyLink}>
                                    <Share2 className="w-4 h-4" />
                                    <span>Copy Room Link</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/">
                                        <Home className="w-4 h-4" />
                                        <span>Leave Room</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Info</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <div className="px-2 py-1.5 text-sm">
                                    <Users className="w-4 h-4 inline mr-2" />
                                    <span className="text-gray-500">
                                        Users: 1
                                    </span>
                                </div>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <div className="px-2 py-1.5 text-sm">
                                    <Video className="w-4 h-4 inline mr-2" />
                                    <span className="text-gray-500">
                                        Queue: 0
                                    </span>
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 space-y-3 border-t">
                {/* User section */}
                <div className="flex items-center gap-3 px-2 py-1">
                    <div className="size-8 rounded-full bg-gradient-to-br from-zinc-500 to-black/60 flex items-center justify-center text-white text-sm font-semibold">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            Anonymous
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            Guest User
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Settings dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="cursor-pointer flex-1 justify-start gap-2"
                            >
                                <Cog className="size-4" />
                                <span>Settings</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="gap-2">
                                    <UserCircle className="size-4" />
                                    <span>Change Name</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <Palette className="size-4" />
                                    <span>Theme</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Logout button */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="cursor-pointer text-destructive hover:bg-destructive/10"
                        onClick={() => (window.location.href = "/")}
                        title="Leave Room"
                    >
                        <LogOut className="size-4" />
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                    Pubby Clone v1.0
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
