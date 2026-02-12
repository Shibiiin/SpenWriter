import { useState } from 'react'
import { Search, Trash2, MessageSquare, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import type { Conversation } from '@/types'
import { LANGUAGE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

interface ConversationHistoryProps {
  conversations: Conversation[]
  loading: boolean
  onSelect: (conversation: Conversation) => void
  onDelete: (id: number) => void
  onSearch: (query: string) => Promise<Conversation[]>
}

export function ConversationHistory({
  conversations,
  loading,
  onSelect,
  onDelete,
  onSearch,
}: ConversationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = await onSearch(query)
      setSearchResults(results)
    } else {
      setSearchResults(null)
    }
  }

  const displayConversations = searchResults ?? conversations

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Conversations list */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading conversations...
            </div>
          )}
          {!loading && displayConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          )}
          {displayConversations.map((conv) => (
            <Card
              key={conv.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onSelect(conv)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {conv.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(conv)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(conv.updatedAt))}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {conv.messages.length} messages
                  </span>
                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                    {LANGUAGE_LABELS[conv.language]}
                  </span>
                </div>
                {conv.messages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {conv.messages[conv.messages.length - 1].text}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget?.id != null) {
                  onDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
