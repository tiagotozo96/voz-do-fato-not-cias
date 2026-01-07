import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { ResizableImageExtension } from '@/extensions/ResizableImageExtension';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Upload,
  Loader2,
  Youtube as YoutubeIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ content, onChange, placeholder = 'Escreva o conteúdo aqui...' }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      ResizableImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        nocookie: true,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `editor/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news-images')
        .getPublicUrl(filePath);

      editor?.chain().focus().setImage({ src: publicUrl }).run();
      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editorContainerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addYoutubeVideo = () => {
    const url = window.prompt('URL do vídeo do YouTube:');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children,
    title
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8",
        isActive && "bg-muted text-primary"
      )}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div 
      ref={editorContainerRef}
      className={cn(
        "border border-input rounded-md overflow-hidden relative transition-colors",
        isDragging && "border-primary border-2 bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-background border border-primary rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">Solte a imagem aqui</span>
          </div>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1 border-b border-input bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Riscado"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Citação"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Adicionar link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          title="Adicionar imagem por URL"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload de imagem"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </ToolbarButton>
        <ToolbarButton
          onClick={addYoutubeVideo}
          title="Adicionar vídeo do YouTube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Desfazer"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Refazer"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      
      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-3 min-h-[200px] focus:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_div[data-youtube-video]]:my-4 [&_.ProseMirror_div[data-youtube-video]]:flex [&_.ProseMirror_div[data-youtube-video]]:justify-center [&_.ProseMirror_div[data-youtube-video]_iframe]:rounded-lg [&_.ProseMirror_div[data-youtube-video]_iframe]:max-w-full [&_.ProseMirror_div[data-youtube-video]_iframe]:aspect-video"
      />
    </div>
  );
};
