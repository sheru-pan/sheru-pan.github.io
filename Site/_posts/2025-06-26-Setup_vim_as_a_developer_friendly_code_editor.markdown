---
layout: post
title: "🛠️ Setup Vim as a Developer-Friendly Code Editor"
permalink: /blog/Setup_Vim_as_a_Developer-Friendly_Code_Editor/
---

# Setup Vim as a Developer-Friendly Code Editor

If you're a developer aspiring to become a security researcher, using prebuilt OSINT tools is a great start. But to truly innovate—modifying existing tools or building your own—you need a powerful and efficient coding environment.

In the field of infosec, the terminal becomes your second home. While terminal-based editors aren't the most beginner-friendly, they are essential tools for any serious security researcher. Mastering them not only sharpens your workflow but also prepares you for real-world scenarios where GUI-based tools might not be available.

I started my journey with `nano`—simple and beginner-friendly. But as my needs grew, so did the limitations of nano. That's when I decided to switch to `vi`/`vim`—a more advanced terminal-based editor that offers incredible flexibility and power.

Today, I'm configuring Vim to mimic features from modern IDEs like Visual Studio Code. My goal is to save time and boost efficiency through hard, consistent practice—because I believe in _practice hard to make life easy_.

Let’s walk through setting up Vim as a full-fledged coding environment.

---

## 🛠️ Step-by-Step Vim Setup

### 🔧1. Install Vim

```bash
sudo apt update
sudo apt install vim
```

---

### 🧱 2. Install Plugin Manager (`vim-plug`)

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
   https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

---

### 🗂️ 3. Configure `~/.vimrc`

Open or create your Vim configuration file:

```bash
vim ~/.vimrc
```

Paste the following configuration:

```vim
" ----------------------------
" VS Code-like Vim Configuration
" ----------------------------

call plug#begin('~/.vim/plugged')

" File explorer with icons
Plug 'preservim/nerdtree'
Plug 'ryanoasis/vim-devicons'

" Enhanced status line
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

" Syntax highlighting for many languages
Plug 'sheerun/vim-polyglot'

" Git integration
Plug 'tpope/vim-fugitive'

" Linting and diagnostics
Plug 'dense-analysis/ale'

" Auto code formatting
Plug 'Chiel92/vim-autoformat'

" Color scheme
Plug 'morhetz/gruvbox'

call plug#end()

" === General Settings ===
syntax on
set number
set relativenumber
set tabstop=4
set shiftwidth=4
set expandtab
set smartindent
set autoindent
set background=dark
colorscheme gruvbox

" === Status Line ===
let g:airline_theme='gruvbox'
let g:airline_powerline_fonts=1

" === NERDTree Shortcut ===
nnoremap <C-n> :NERDTreeToggle<CR>

" === Format on Save ===
autocmd BufWritePre * :Autoformat

" === Git Shortcut ===
nnoremap <leader>gs :G<CR>

" === Mouse Support ===
set mouse=a

" === Enable Icons ===
set encoding=utf-8
let g:WebDevIconsUnicodeDecorateFileNodes = 1
let g:NERDTreeShowHidden=1
```

---

### 🔌 4. Install Vim Plugins

Open Vim and run the following command:

```vim
:PlugInstall
```

---

### 🧼 5. Set Up Autoformatters

Install external formatters based on the languages you use:

```bash
sudo apt install clang-format       # For C/C++
sudo apt install black              # For Python
sudo npm install -g prettier        # For JS/HTML/CSS/JSON
```

---

### 🎨 6. Enable Icons with Nerd Fonts (Optional but Recommended)

Install Nerd Fonts for proper icon rendering. Here's an example using JetBrainsMono:

```bash
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
wget https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip
unzip JetBrainsMono.zip
fc-cache -fv
```

Then, in your terminal settings, set the font to **JetBrainsMono Nerd Font**.

---

**Happy Hacking!** 🐧💻🛡️
