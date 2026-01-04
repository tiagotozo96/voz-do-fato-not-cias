import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, LogOut, Newspaper, Eye, LayoutDashboard, Tag, X, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsPreview } from '@/components/NewsPreview';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category_id: string;
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  categories: Category | null;
}

const Admin = () => {
  const { user, loading, isEditor, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Tag management state
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagName, setTagName] = useState('');
  const [isSavingTag, setIsSavingTag] = useState(false);

  // Category management state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#dc2626');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    
    const [newsResult, categoriesResult, tagsResult] = await Promise.all([
      supabase
        .from('news')
        .select('*, categories(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('tags').select('*').order('name')
    ]);
    
    if (newsResult.data) {
      setNews(newsResult.data as News[]);
    }
    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
    }
    if (tagsResult.data) {
      setTags(tagsResult.data);
    }
    
    setIsLoadingData(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `news/${fileName}`;
    
    const { error } = await supabase.storage
      .from('news-images')
      .upload(filePath, file);
    
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const resetForm = () => {
    setTitle('');
    setExcerpt('');
    setContent('');
    setImageUrl('');
    setCategoryId('');
    setIsFeatured(false);
    setIsPublished(false);
    setImageFile(null);
    setEditingNews(null);
    setSelectedTagIds([]);
  };

  const openEditDialog = async (newsItem: News) => {
    setEditingNews(newsItem);
    setTitle(newsItem.title);
    setExcerpt(newsItem.excerpt || '');
    setContent(newsItem.content || '');
    setImageUrl(newsItem.image_url || '');
    setCategoryId(newsItem.category_id || '');
    setIsFeatured(newsItem.is_featured);
    setIsPublished(newsItem.is_published);
    
    // Fetch tags for this news
    const { data: newsTags } = await supabase
      .from('news_tags')
      .select('tag_id')
      .eq('news_id', newsItem.id);
    
    if (newsTags) {
      setSelectedTagIds(newsTags.map(nt => nt.tag_id));
    }
    
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !categoryId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e selecione uma categoria.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      let finalImageUrl = imageUrl;
      
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const slug = generateSlug(title);
      const newsData = {
        title,
        slug: editingNews ? editingNews.slug : slug,
        excerpt,
        content,
        image_url: finalImageUrl,
        category_id: categoryId,
        is_featured: isFeatured,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        author_id: user?.id,
      };

      let newsId = editingNews?.id;
      
      if (editingNews) {
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingNews.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('news')
          .insert(newsData)
          .select('id')
          .single();
        
        if (error) throw error;
        newsId = data.id;
      }
      
      // Update tags
      if (newsId) {
        // Remove existing tags
        await supabase.from('news_tags').delete().eq('news_id', newsId);
        
        // Add selected tags
        if (selectedTagIds.length > 0) {
          const tagInserts = selectedTagIds.map(tagId => ({
            news_id: newsId,
            tag_id: tagId,
          }));
          await supabase.from('news_tags').insert(tagInserts);
        }
      }
      
      toast({ title: editingNews ? 'Notícia atualizada com sucesso!' : 'Notícia criada com sucesso!' });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
    
    const { error } = await supabase.from('news').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Notícia excluída!' });
      fetchData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Tag management functions
  const resetTagForm = () => {
    setTagName('');
    setEditingTag(null);
  };

  const openEditTagDialog = (tag: TagItem) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setIsTagDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome da tag.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingTag(true);
    
    try {
      const slug = generateSlug(tagName);
      
      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update({ name: tagName.trim(), slug })
          .eq('id', editingTag.id);
        
        if (error) throw error;
        toast({ title: 'Tag atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('tags')
          .insert({ name: tagName.trim(), slug });
        
        if (error) throw error;
        toast({ title: 'Tag criada com sucesso!' });
      }

      setIsTagDialogOpen(false);
      resetTagForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setIsSavingTag(false);
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tag?')) return;
    
    const { error } = await supabase.from('tags').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Tag excluída!' });
      fetchData();
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Category management functions
  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryColor('#dc2626');
    setCategoryIcon('');
    setEditingCategory(null);
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || '#dc2626');
    setCategoryIcon(category.icon || '');
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome da categoria.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingCategory(true);
    
    try {
      const slug = generateSlug(categoryName);
      
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ 
            name: categoryName.trim(), 
            slug,
            color: categoryColor,
            icon: categoryIcon || null
          })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast({ title: 'Categoria atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ 
            name: categoryName.trim(), 
            slug,
            color: categoryColor,
            icon: categoryIcon || null
          });
        
        if (error) throw error;
        toast({ title: 'Categoria criada com sucesso!' });
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setIsSavingCategory(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Notícias vinculadas ficarão sem categoria.')) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Categoria excluída!' });
      fetchData();
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6" />
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Notícias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{news.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Publicadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{news.filter(n => n.is_published).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{news.filter(n => !n.is_published).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{categories.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tags.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="news" className="space-y-4">
          <TabsList>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Notícias
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="news">
            {/* News Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Gerenciar Notícias
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Notícia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingNews ? 'Editar Notícia' : 'Nova Notícia'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Título da notícia"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria *</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                          {tags.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Nenhuma tag disponível</span>
                          ) : (
                            tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                                className="cursor-pointer transition-colors"
                                onClick={() => toggleTagSelection(tag.id)}
                              >
                                {tag.name}
                                {selectedTagIds.includes(tag.id) && (
                                  <X className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="excerpt">Resumo</Label>
                        <Textarea
                          id="excerpt"
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Breve resumo da notícia"
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="content">Conteúdo</Label>
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Conteúdo completo da notícia"
                          rows={6}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="image">Imagem</Label>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        />
                        {imageUrl && !imageFile && (
                          <img src={imageUrl} alt="Preview" className="mt-2 h-32 object-cover rounded" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="featured"
                            checked={isFeatured}
                            onCheckedChange={setIsFeatured}
                          />
                          <Label htmlFor="featured">Destaque</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="published"
                            checked={isPublished}
                            onCheckedChange={setIsPublished}
                          />
                          <Label htmlFor="published">Publicar</Label>
                        </div>
                      </div>
                      
                      <div className="flex justify-between gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={() => setIsPreviewOpen(true)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Preview Dialog */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogContent className="max-w-4xl max-h-[95vh]">
                    <DialogHeader>
                      <DialogTitle>Preview da Notícia</DialogTitle>
                    </DialogHeader>
                    <NewsPreview
                      title={title}
                      excerpt={excerpt}
                      content={content}
                      imageUrl={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                      categoryName={categories.find(c => c.id === categoryId)?.name || ''}
                      tags={tags.filter(t => selectedTagIds.includes(t.id))}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {news.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma notícia cadastrada. Clique em "Nova Notícia" para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      news.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {item.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.categories?.name || 'Sem categoria'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.is_published ? (
                              <Badge className="bg-green-600">Publicado</Badge>
                            ) : (
                              <Badge variant="secondary">Rascunho</Badge>
                            )}
                            {item.is_featured && (
                              <Badge className="ml-1 bg-yellow-600">Destaque</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            {/* Categories Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Gerenciar Categorias
                </CardTitle>
                <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
                  setIsCategoryDialogOpen(open);
                  if (!open) resetCategoryForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Nome da Categoria *</Label>
                        <Input
                          id="categoryName"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="Ex: Política, Economia, Esportes..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="categoryColor">Cor</Label>
                        <div className="flex gap-2">
                          <Input
                            id="categoryColor"
                            type="color"
                            value={categoryColor}
                            onChange={(e) => setCategoryColor(e.target.value)}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={categoryColor}
                            onChange={(e) => setCategoryColor(e.target.value)}
                            placeholder="#dc2626"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="categoryIcon">Ícone (nome do Lucide icon)</Label>
                        <Input
                          id="categoryIcon"
                          value={categoryIcon}
                          onChange={(e) => setCategoryIcon(e.target.value)}
                          placeholder="Ex: newspaper, globe, trophy..."
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveCategory} disabled={isSavingCategory}>
                          {isSavingCategory ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <Badge 
                              style={{ backgroundColor: category.color || '#dc2626' }}
                              className="text-white"
                            >
                              {category.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.slug}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: category.color || '#dc2626' }}
                              />
                              <span className="text-sm text-muted-foreground">{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditCategoryDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tags">
            {/* Tags Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Gerenciar Tags
                </CardTitle>
                <Dialog open={isTagDialogOpen} onOpenChange={(open) => {
                  setIsTagDialogOpen(open);
                  if (!open) resetTagForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingTag ? 'Editar Tag' : 'Nova Tag'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tagName">Nome da Tag *</Label>
                        <Input
                          id="tagName"
                          value={tagName}
                          onChange={(e) => setTagName(e.target.value)}
                          placeholder="Ex: Política, Economia, Esportes..."
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveTag} disabled={isSavingTag}>
                          {isSavingTag ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhuma tag cadastrada. Clique em "Nova Tag" para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">
                            <Badge variant="secondary">{tag.name}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {tag.slug}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditTagDialog(tag)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTag(tag.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
