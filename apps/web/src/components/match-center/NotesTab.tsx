import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Tag,
  Edit3,
  Trash2,
  Save,
  X,
  Star,
  AlertTriangle,
  Eye,
  Ban,
  HelpCircle,
} from 'lucide-react'
import { useAppStore } from '../../lib/store'
import { cn } from '../../lib/utils'

interface NotesTabProps {
  fixture: any
}

const PRESET_TAGS = [
  { id: 'watch', label: 'Watch', icon: Eye, color: 'accent-primary' },
  { id: 'value', label: 'Value?', icon: Star, color: 'accent-warning' },
  { id: 'avoid', label: 'Avoid', icon: Ban, color: 'accent-danger' },
  { id: 'derby', label: 'Derby', icon: AlertTriangle, color: 'accent-orange' },
  { id: 'rotation', label: 'Rotation Risk', icon: HelpCircle, color: 'accent-purple' },
]

export function NotesTab({ fixture }: NotesTabProps) {
  const { matchNotes, setMatchNote } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const existingNote = matchNotes[fixture.id]

  const handleStartEdit = () => {
    setNoteContent(existingNote?.content || '')
    setSelectedTags(existingNote?.tags || [])
    setIsEditing(true)
  }

  const handleSave = () => {
    setMatchNote(fixture.id, noteContent, selectedTags)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNoteContent('')
    setSelectedTags([])
  }

  const handleDelete = () => {
    setMatchNote(fixture.id, '', [])
    setIsEditing(false)
    setNoteContent('')
    setSelectedTags([])
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Quick Tags */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-accent-primary" />
          Quick Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map(tag => {
            const isActive = isEditing
              ? selectedTags.includes(tag.id)
              : existingNote?.tags?.includes(tag.id)

            return (
              <button
                key={tag.id}
                onClick={() => isEditing ? toggleTag(tag.id) : handleStartEdit()}
                className={cn(
                  "chip transition-all",
                  isActive && `bg-${tag.color}/20 text-${tag.color} border-${tag.color}/30`,
                  !isActive && "chip-neutral hover:bg-terminal-elevated"
                )}
              >
                <tag.icon className="w-3 h-3" />
                {tag.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes Section */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-primary" />
            Match Notes
          </h4>
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="btn btn-ghost p-1.5"
            >
              {existingNote?.content ? (
                <Edit3 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Tag Selection */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "chip text-[10px] transition-all",
                        selectedTags.includes(tag.id)
                          ? `bg-${tag.color}/20 text-${tag.color} border-${tag.color}/30`
                          : "chip-neutral hover:bg-terminal-elevated"
                      )}
                    >
                      <tag.icon className="w-2.5 h-2.5" />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Notes</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add your research notes, observations, or reminders..."
                  className="input min-h-[120px] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {existingNote?.content && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-ghost text-accent-danger p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleCancel}
                    className="btn btn-ghost"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          ) : existingNote?.content ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Display Tags */}
              {existingNote.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {existingNote.tags.map(tagId => {
                    const tag = PRESET_TAGS.find(t => t.id === tagId)
                    if (!tag) return null
                    return (
                      <span
                        key={tagId}
                        className={cn(
                          "chip text-[10px]",
                          `bg-${tag.color}/20 text-${tag.color} border-${tag.color}/30`
                        )}
                      >
                        <tag.icon className="w-2.5 h-2.5" />
                        {tag.label}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Note Content */}
              <div className="text-sm text-text-secondary whitespace-pre-wrap">
                {existingNote.content}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <FileText className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted mb-3">No notes yet</p>
              <button
                onClick={handleStartEdit}
                className="btn btn-secondary"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Research Prompts */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-3">Research Prompts</h4>
        <div className="space-y-2 text-xs">
          <ResearchPrompt
            question="What's the recent form like?"
            onClick={() => {
              setNoteContent(prev => prev + (prev ? '\n\n' : '') + '## Form Analysis\n')
              setIsEditing(true)
            }}
          />
          <ResearchPrompt
            question="Any key absences?"
            onClick={() => {
              setNoteContent(prev => prev + (prev ? '\n\n' : '') + '## Key Absences\n')
              setIsEditing(true)
            }}
          />
          <ResearchPrompt
            question="What do the underlying numbers say?"
            onClick={() => {
              setNoteContent(prev => prev + (prev ? '\n\n' : '') + '## xG Analysis\n')
              setIsEditing(true)
            }}
          />
          <ResearchPrompt
            question="Is there value in the odds?"
            onClick={() => {
              setNoteContent(prev => prev + (prev ? '\n\n' : '') + '## Odds Assessment\n')
              setIsEditing(true)
            }}
          />
        </div>
      </div>

      {/* Team Notes */}
      <div className="grid grid-cols-2 gap-3">
        <TeamNoteCard
          teamName={fixture.homeTeam.name}
          teamLogo={fixture.homeTeam.logo}
        />
        <TeamNoteCard
          teamName={fixture.awayTeam.name}
          teamLogo={fixture.awayTeam.logo}
        />
      </div>
    </div>
  )
}

function ResearchPrompt({ question, onClick }: { question: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2 rounded-lg bg-terminal-elevated hover:bg-terminal-elevated/80 transition-colors flex items-center gap-2 text-text-secondary hover:text-text-primary"
    >
      <HelpCircle className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
      <span>{question}</span>
      <Plus className="w-3.5 h-3.5 ml-auto text-text-muted" />
    </button>
  )
}

function TeamNoteCard({ teamName, teamLogo }: { teamName: string; teamLogo: string | null }) {
  const [showInput, setShowInput] = useState(false)
  const [note, setNote] = useState('')

  return (
    <div className="stat-card p-3">
      <div className="flex items-center gap-2 mb-2">
        {teamLogo && (
          <img src={teamLogo} alt="" className="w-5 h-5 object-contain" />
        )}
        <span className="text-xs font-medium truncate">{teamName}</span>
      </div>

      {showInput ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Team-specific notes..."
            className="input text-xs min-h-[60px] resize-none"
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setShowInput(false)}
              className="btn btn-ghost p-1"
            >
              <X className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="btn btn-primary p-1"
            >
              <Save className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full text-center py-2 text-xs text-text-muted hover:text-accent-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mx-auto mb-1" />
          Add note
        </button>
      )}
    </div>
  )
}

