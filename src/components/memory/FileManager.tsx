import { FileAudio, Trash2, Play, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AudioFile } from '@/types'
import { formatDate, formatFileSize, formatDuration } from '@/lib/utils'

interface FileManagerProps {
  files: AudioFile[]
  loading: boolean
  onDelete: (id: number) => void
}

export function FileManager({ files, loading, onDelete }: FileManagerProps) {
  const handlePlay = (file: AudioFile) => {
    const url = URL.createObjectURL(file.blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    audio.play()
  }

  const handleDownload = (file: AudioFile) => {
    const url = URL.createObjectURL(file.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.name}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {files.length} audio file{files.length !== 1 ? 's' : ''}
        </h3>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading files...
            </div>
          )}
          {!loading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileAudio className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No audio files saved yet</p>
            </div>
          )}
          {files.map((file) => (
            <Card key={file.id}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-muted-foreground" />
                    {file.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePlay(file)}>
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => file.id != null && onDelete(file.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(new Date(file.createdAt))}</span>
                  <span>{formatFileSize(file.size)}</span>
                  <span>{formatDuration(file.duration)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
