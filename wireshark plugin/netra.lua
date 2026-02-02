-- Netra Prototype Help Plugin

-- 1. Function to open the website
local function open_netra_website()
    browser_open_url("https://netra-test-c3b95.web.app/")
end

-- 2. Add to the "Tools" Menu
register_menu("Netra Help", open_netra_website, MENU_TOOLS_UNSORTED)

-- 3. Add a button to the Toolbar (Optional)
-- This creates a new toolbar named "Netra" with a button inside it
local netra_toolbar = ext_toolbar_register_toolbar("Netra")

ext_toolbar_add_entry(netra_toolbar, 
    EXT_TOOLBAR_BUTTON,           -- Type
    "Open Netra Website",         -- Label
    nil,                          -- Icon (nil uses default)
    "Click to visit the project", -- Tooltip
    false,                        -- Validation required
    nil,                          -- Context
    open_netra_website            -- Function to call
)