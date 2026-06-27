import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useChatRooms, useChatMessages, useSendMessage } from "@/hooks/useChat";
import { useUpdateInquiryStatus } from "@/hooks/useInquiries";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@/hooks/useChat";

export function Chat() {
  const { data: user } = useAuth();
  const { data: rooms, isLoading: isLoadingRooms } = useChatRooms();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const { data: messages, isLoading: isLoadingMessages } = useChatMessages(activeRoomId);
  const sendMessage = useSendMessage();
  const updateInquiryStatus = useUpdateInquiryStatus();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();

  const activeRoom = rooms?.find((r: any) => r.id === activeRoomId);
  const isSeller = activeRoom ? user?.id === activeRoom.seller_id : false;
  const isDealLocked = activeRoom ? ['Deal Locked', 'Closed', 'Closed_Won', 'Deal Closed'].includes(activeRoom.inquiry_status) : false;

  // Initialize socket
  useEffect(() => {
    const socket = connectSocket();

    const handleNewMessage = (msg: ChatMessage) => {
      // Append message to cache
      queryClient.setQueryData(
        ['chat', 'messages', msg.room_id], 
        (oldData: ChatMessage[] | undefined) => {
          if (!oldData) return [msg];
          // avoid duplicates
          if (oldData.find(m => m.id === msg.id)) return oldData;
          return [...oldData, msg];
        }
      );
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
      disconnectSocket();
    };
  }, [queryClient]);

  // Handle joining rooms
  useEffect(() => {
    const socket = connectSocket();
    if (activeRoomId) {
      socket.emit('join_room', activeRoomId);
    }
    return () => {
      if (activeRoomId) {
        socket.emit('leave_room', activeRoomId);
      }
    };
  }, [activeRoomId]);

  // Automatically select the first room if none is selected
  useEffect(() => {
    if (location.state?.roomId) {
      setActiveRoomId(location.state.roomId);
    } else if (rooms && rooms.length > 0 && !activeRoomId) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, location.state]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    try {
      await sendMessage.mutateAsync({ roomId: activeRoomId, message: newMessage });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleLockDeal = async () => {
    if (!activeRoom) return;
    try {
      await updateInquiryStatus.mutateAsync({ id: activeRoom.inquiry_id, status: 'Deal Locked' });
      // Invalidate chat rooms to get the updated status
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    } catch (error) {
      console.error("Failed to lock deal", error);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Rooms Sidebar */}
      <div className="w-1/3 border-r bg-slate-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-lg text-slate-900">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingRooms ? (
            <div className="flex p-8 justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : rooms?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No active conversations.</div>
          ) : (
            <div className="flex flex-col">
              {rooms?.map((room: any) => {
                const isBuyer = user?.id === room.buyer_id;
                const otherPartyId = isBuyer ? room.seller_id : room.buyer_id;
                
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`flex items-start gap-3 p-4 text-left transition-colors border-b last:border-0 ${
                      activeRoomId === room.id ? "bg-emerald-50 border-l-4 border-l-emerald-600" : "hover:bg-slate-100 border-l-4 border-l-transparent"
                    }`}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                        U{otherPartyId}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium text-sm text-slate-900 truncate">
                          Inquiry #{room.inquiry_id}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(room.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        Equipment #{room.equipment_post_id}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#efeae2]">
        {activeRoomId ? (
          <>
            <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                   <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                      #
                   </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-slate-900">Chat Room #{activeRoomId}</h3>
                  <p className="text-xs text-emerald-600 font-medium">Online</p>
                </div>
              </div>
              
              <div>
                {isDealLocked ? (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
                    <span className="text-sm font-semibold">Deal Locked 🔒</span>
                  </div>
                ) : isSeller ? (
                  <Button 
                    onClick={handleLockDeal}
                    disabled={updateInquiryStatus.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                  >
                    {updateInquiryStatus.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <span className="mr-2">🔒</span>
                    )}
                    Lock Deal
                  </Button>
                ) : null}
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] bg-repeat bg-opacity-50" style={{ backgroundSize: "400px" }}>
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <div className="bg-white/80 p-3 rounded-full shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages?.map((msg: any) => {
                    const isSelf = user?.id === msg.sender_id;
                    
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[75%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}>
                        <div 
                          className={`px-3 pt-2 pb-1.5 rounded-2xl relative shadow-sm ${
                            isSelf 
                              ? "bg-[#dcf8c6] text-slate-900 rounded-tr-none" 
                              : "bg-white text-slate-900 rounded-tl-none"
                          }`}
                        >
                          <p className="text-[15px] leading-snug">{msg.message}</p>
                          <div className="flex justify-end items-center gap-1 mt-1">
                            <span className="text-[10px] text-slate-500">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Read receipt tick - always show grey double tick for demo if self */}
                            {isSelf && (
                              <svg viewBox="0 0 16 15" width="16" height="15" className="text-blue-500 fill-current ml-1">
                                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.346.125.467-.025l6.253-8.113a.366.366 0 0 0-.03-.514z"></path>
                                <path d="M9.814 3.316l-.478-.372a.365.365 0 0 0-.51.063L3.466 9.879a.32.32 0 0 1-.484.033L1.13 8.214a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l2.294 2.201c.143.14.346.125.467-.025l6.253-8.113a.366.366 0 0 0-.03-.514z"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-3 bg-[#f0f2f5] border-t flex gap-3 items-end">
              <div className="flex-1 bg-white rounded-2xl flex items-center px-4 py-2 border border-slate-200">
                <form onSubmit={handleSend} className="w-full flex">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 shadow-none"
                  />
                  <button 
                    type="submit" 
                    disabled={sendMessage.isPending || !newMessage.trim()} 
                    className={`ml-2 h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
                      newMessage.trim() ? "text-emerald-600 hover:bg-slate-100" : "text-slate-400"
                    }`}
                  >
                    <Send className="h-5 w-5 ml-1" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#f0f2f5]">
            <div className="bg-white p-6 rounded-full mb-6 shadow-sm">
              <MessageSquare className="h-16 w-16 text-emerald-200" />
            </div>
            <h2 className="text-xl font-light text-slate-700 mb-2">WhatsApp Web style interface</h2>
            <p className="text-sm">Select a conversation to start chatting seamlessly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
