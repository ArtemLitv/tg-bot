import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { getMenuConfig, updateMenuConfig } from '../services/api';

// Define interfaces for menu items
interface MessageContent {
  text?: string;
  photo?: string;
  link?: {
    url: string;
    text: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface MenuItem {
  title: string;
  message?: string | MessageContent;
  subMenu?: MenuItem[];
  action?: 'back';
}

// Dialog state interface
interface DialogState {
  open: boolean;
  item: MenuItem | null;
  parentItems: MenuItem[] | null;
  isNew: boolean;
  index: number;
}

const MenuEditor: React.FC = () => {
  // We use menuString for saving the menu configuration
  const [menuString, setMenuString] = useState<string>('');
  const [menuObject, setMenuObject] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for expanded menu items
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // State for edit dialog
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    item: null,
    parentItems: null,
    isNew: false,
    index: -1
  });

  useEffect(() => {
    fetchMenuConfig();
  }, []);

  const fetchMenuConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMenuConfig();
      setMenuString(response.data.menuString);

      // Convert string to object for the tree view
      try {
        // Parse the menu string to get a JavaScript object
        // Use a safer approach to convert JavaScript object notation to valid JSON
        let menuObj;
        try {
          // Use Function constructor to safely evaluate the JavaScript object
          // This is safer than eval() and handles complex strings better
          menuObj = Function('return ' + response.data.menuString)();

          // Validate that we got an array
          if (!Array.isArray(menuObj)) {
            throw new Error('Menu configuration is not an array');
          }
        } catch (evalError) {
          console.error('Failed to evaluate menu string:', evalError);
          throw new Error('Failed to parse menu configuration');
        }
        setMenuObject(menuObj);

        // Initialize expanded state for top-level items
        const initialExpanded: Record<string, boolean> = {};
        menuObj.forEach((item: MenuItem, index: number) => {
          initialExpanded[`${index}`] = true; // Expand top-level items by default
        });
        setExpanded(initialExpanded);
      } catch (parseError) {
        console.error('Failed to parse menu string:', parseError);
        setError('Failed to parse menu configuration. The format may be invalid.');
      }
    } catch (error) {
      console.error('Failed to get menu configuration:', error);
      setError('Failed to load menu configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert menu object to string for saving
  const menuObjectToString = (menuObj: MenuItem[]): string => {
    try {
      // First, stringify the object with proper indentation
      let stringified = JSON.stringify(menuObj, null, 2);

      // Then convert it to JavaScript object notation style
      // 1. Remove quotes around valid JS property names
      stringified = stringified.replace(/"([\w$][\w$-]*)":/g, '$1:');

      // 2. Replace double quotes with single quotes for strings
      stringified = stringified.replace(/"([^"]+)"/g, "'$1'");

      return stringified;
    } catch (error) {
      console.error('Error converting object to string:', error);
      // Fall back to the original JSON string
      return JSON.stringify(menuObj, null, 2);
    }
  };

  const handleSave = async () => {
    if (!menuObject || menuObject.length === 0) {
      setError('Menu configuration is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert the menu object to a string
      const menuStr = menuObjectToString(menuObject);
      setMenuString(menuStr);

      await updateMenuConfig({ menuString: menuStr });
      setSuccess('Menu configuration updated successfully');
    } catch (error) {
      console.error('Failed to update menu configuration:', error);
      setError('Failed to update menu configuration. Please check the format and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle expanded state for a menu item
  const toggleExpanded = (path: string) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Open dialog to add a new menu item
  const handleAddItem = (parentItems: MenuItem[] | undefined | null, index: number = -1) => {
    setDialog({
      open: true,
      item: { title: '' },
      parentItems: parentItems || null,
      isNew: true,
      index
    });
  };

  // Open dialog to edit an existing menu item
  const handleEditItem = (item: MenuItem, parentItems: MenuItem[] | null, index: number) => {
    setDialog({
      open: true,
      item: { ...item },
      parentItems,
      isNew: false,
      index
    });
  };

  // Delete a menu item
  const handleDeleteItem = (parentItems: MenuItem[] | null, index: number) => {
    if (!parentItems) {
      // Deleting from root level
      const newMenu = [...menuObject];
      newMenu.splice(index, 1);
      setMenuObject(newMenu);
    } else {
      // Deleting from a submenu
      parentItems.splice(index, 1);
      setMenuObject([...menuObject]); // Trigger re-render
    }
  };

  // Save changes from dialog
  const handleDialogSave = () => {
    if (!dialog.item || !dialog.item.title) {
      return;
    }

    if (dialog.isNew) {
      if (!dialog.parentItems) {
        // Adding to root level
        setMenuObject([...menuObject, dialog.item]);
      } else if (dialog.index >= 0) {
        // Adding at specific position
        dialog.parentItems.splice(dialog.index + 1, 0, dialog.item);
        setMenuObject([...menuObject]); // Trigger re-render
      } else {
        // Adding to end of parent
        if (Array.isArray(dialog.parentItems)) {
          // If parentItems is an array (submenu), add to it
          dialog.parentItems.push(dialog.item);
        } else {
          // If parentItems is a single item, add to its subMenu
          // Cast to MenuItem to fix TypeScript error
          const parentItem = dialog.parentItems as unknown as MenuItem;
          if (!parentItem.subMenu) {
            parentItem.subMenu = [];
          }
          parentItem.subMenu.push(dialog.item);
        }
        setMenuObject([...menuObject]); // Trigger re-render
      }
    } else if (dialog.parentItems && dialog.index >= 0) {
      // Editing existing item
      dialog.parentItems[dialog.index] = dialog.item;
      setMenuObject([...menuObject]); // Trigger re-render
    }

    setDialog({ ...dialog, open: false });
  };

  // Recursive component to render menu items
  const MenuItemNode: React.FC<{
    item: MenuItem;
    path: string;
    parentItems: MenuItem[] | null;
    index: number;
  }> = ({ item, path, parentItems, index }) => {
    const isExpanded = expanded[path] || false;
    const hasSubMenu = item.subMenu && item.subMenu.length > 0;

    // Determine icon based on item properties
    const getItemIcon = () => {
      if (item.action === 'back') {
        return <ArrowBackIcon />;
      } else if (item.message) {
        if (typeof item.message === 'string') {
          return <MessageIcon />;
        } else {
          if (item.message.photo) {
            return <ImageIcon />;
          } else if (item.message.link) {
            return <LinkIcon />;
          } else if (item.message.location) {
            return <LocationIcon />;
          } else {
            return <MessageIcon />;
          }
        }
      } else if (hasSubMenu) {
        return isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />;
      }
      return null;
    };

    return (
      <>
        <ListItem
          sx={{
            pl: path.split('-').length * 2,
            borderLeft: hasSubMenu ? '1px dashed #ccc' : 'none',
            ml: hasSubMenu ? 1 : 0
          }}
        >
          <ListItemIcon onClick={() => hasSubMenu && toggleExpanded(path)}>
            {getItemIcon()}
          </ListItemIcon>
          <ListItemText 
            primary={item.title} 
            secondary={
              item.message 
                ? typeof item.message === 'string' 
                  ? item.message 
                  : item.message.text || (item.message.link ? item.message.link.text : '')
                : null
            }
          />
          <Box>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleEditItem(item, parentItems, index)}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteItem(parentItems, index)}
            >
              <DeleteIcon />
            </IconButton>
            {hasSubMenu && (
              <IconButton 
                size="small" 
                color="success"
                onClick={() => handleAddItem(item.subMenu, -1)}
              >
                <AddIcon />
              </IconButton>
            )}
            {!hasSubMenu && (
              <IconButton 
                size="small" 
                color="success"
                onClick={() => {
                  if (!item.subMenu) {
                    item.subMenu = [];
                  }
                  handleAddItem(item.subMenu, -1);
                }}
              >
                <AddIcon />
              </IconButton>
            )}
          </Box>
        </ListItem>

        {hasSubMenu && isExpanded && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subMenu!.map((subItem, subIndex) => (
                <MenuItemNode
                  key={`${path}-${subIndex}`}
                  item={subItem}
                  path={`${path}-${subIndex}`}
                  parentItems={item.subMenu!}
                  index={subIndex}
                />
              ))}
              <ListItem sx={{ pl: (path.split('-').length + 1) * 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddItem(item.subMenu, -1)}
                  size="small"
                >
                  Add Item
                </Button>
              </ListItem>
            </List>
          </Collapse>
        )}
      </>
    );
  };

  // Edit dialog component
  const MenuItemDialog = () => {
    const [itemTitle, setItemTitle] = useState('');
    const [messageType, setMessageType] = useState('none');
    const [messageText, setMessageText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [hasAction, setHasAction] = useState(false);

    useEffect(() => {
      if (dialog.item) {
        setItemTitle(dialog.item.title || '');

        if (dialog.item.action === 'back') {
          setHasAction(true);
          setMessageType('none');
        } else if (dialog.item.message) {
          setHasAction(false);

          if (typeof dialog.item.message === 'string') {
            setMessageType('text');
            setMessageText(dialog.item.message);
          } else {
            if (dialog.item.message.photo) {
              setMessageType('photo');
              setPhotoUrl(dialog.item.message.photo);
              setMessageText(dialog.item.message.text || '');
            } else if (dialog.item.message.link) {
              setMessageType('link');
              setLinkUrl(dialog.item.message.link.url);
              setLinkText(dialog.item.message.link.text);
            } else {
              setMessageType('text');
              setMessageText(dialog.item.message.text || '');
            }
          }
        } else {
          setMessageType('none');
          setHasAction(false);
        }
      }
    }, []); // No dependencies needed as we're using dialog.item from closure

    const handleClose = () => {
      setDialog({ ...dialog, open: false });
    };

    const handleSave = () => {
      if (!itemTitle) return;

      const newItem: MenuItem = {
        title: itemTitle
      };

      if (hasAction) {
        newItem.action = 'back';
      } else {
        switch (messageType) {
          case 'text':
            if (messageText) {
              newItem.message = messageText;
            }
            break;
          case 'link':
            if (linkUrl && linkText) {
              newItem.message = {
                link: {
                  url: linkUrl,
                  text: linkText
                }
              };
            }
            break;
          case 'photo':
            if (photoUrl) {
              newItem.message = {
                photo: photoUrl,
                text: messageText
              };
            }
            break;
        }
      }

      // If the item had a submenu, preserve it
      if (dialog.item && dialog.item.subMenu) {
        newItem.subMenu = dialog.item.subMenu;
      }

      setDialog({ ...dialog, item: newItem });
      handleDialogSave();
    };

    return (
      <Dialog open={dialog.open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.isNew ? 'Add Menu Item' : 'Edit Menu Item'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Item Type</InputLabel>
            <Select
              value={hasAction ? 'action' : messageType}
              onChange={(e: SelectChangeEvent) => {
                const value = e.target.value;
                setHasAction(value === 'action');
                if (value !== 'action') {
                  setMessageType(value);
                }
              }}
            >
              <MuiMenuItem value="none">Regular Item</MuiMenuItem>
              <MuiMenuItem value="text">Text Message</MuiMenuItem>
              <MuiMenuItem value="link">Link</MuiMenuItem>
              <MuiMenuItem value="photo">Photo</MuiMenuItem>
              <MuiMenuItem value="action">Back Action</MuiMenuItem>
            </Select>
          </FormControl>

          {!hasAction && messageType === 'text' && (
            <TextField
              margin="dense"
              label="Message Text"
              fullWidth
              multiline
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          )}

          {!hasAction && messageType === 'link' && (
            <>
              <TextField
                margin="dense"
                label="Link URL"
                fullWidth
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Link Text"
                fullWidth
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </>
          )}

          {!hasAction && messageType === 'photo' && (
            <>
              <TextField
                margin="dense"
                label="Photo URL"
                fullWidth
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Caption (optional)"
                fullWidth
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Menu Editor
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Bot Menu Configuration
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchMenuConfig}
              disabled={loading || saving}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || saving || !menuObject || menuObject.length === 0}
            >
              Save Changes
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : menuObject && menuObject.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                color="success"
                onClick={() => handleAddItem(null)}
              >
                Add Root Menu Item
              </Button>
            </Paper>

            <List>
              {menuObject.map((item, index) => (
                <MenuItemNode
                  key={`${index}`}
                  item={item}
                  path={`${index}`}
                  parentItems={null}
                  index={index}
                />
              ))}
            </List>
          </Box>
        ) : (
          <Alert severity="warning">
            No menu items found. Click "Add Root Menu Item" to create your first menu item.
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          About Menu Editor
        </Typography>
        <Typography variant="body1">
          This page allows you to edit the menu configuration for the Telegram bot. The menu defines the structure and content of the bot's responses to user interactions.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          After changing the menu, you will need to restart the bot for the changes to take effect.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
          Note: Be careful when editing the menu structure. Invalid format can cause the bot to malfunction.
        </Typography>
      </Paper>

      {/* Edit Dialog */}
      <MenuItemDialog />
    </Box>
  );
};

export default MenuEditor;
