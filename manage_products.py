#!/usr/bin/env python3
"""Gestionnaire de produits (interface graphique) pour le site.

Lancer :  python manage_products.py
Place ce fichier à la racine du site (à côté de index.html).
Il lit et écrit js/products.js, et copie les photos dans images/.
Aucune installation : utilise seulement la bibliothèque standard (tkinter).
"""
import json, re, shutil, unicodedata
import tkinter as tk
from pathlib import Path
from tkinter import ttk, filedialog, messagebox

ROOT = Path(__file__).resolve().parent
FILE = ROOT / "js" / "products.js"
IMAGES = ROOT / "images"
CATS = ["Protéines", "Créatine", "Gainers", "Vitamines", "Oméga-3", "Pré-workout", "Autres"]


def slugify(text):
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "produit"


def load():
    if not FILE.exists():
        return []
    raw = FILE.read_text(encoding="utf-8")
    start, end = raw.index("["), raw.rindex("]")
    return json.loads(raw[start:end + 1])


def save(products):
    FILE.parent.mkdir(exist_ok=True)
    body = json.dumps(products, ensure_ascii=False, indent=2)
    FILE.write_text("/* Fichier généré par manage_products.py — modifiable aussi à la main */\n"
                    f"const PRODUCTS = {body};\n", encoding="utf-8")


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Gestion des produits")
        self.geometry("900x620")
        self.products = load()
        self.current = None  # index du produit en cours de modification
        self.image_src = None  # chemin d'une nouvelle photo choisie

        left = ttk.Frame(self, padding=10); left.pack(side="left", fill="y")
        self.listbox = tk.Listbox(left, width=32, height=26, exportselection=False)
        self.listbox.pack(fill="y", expand=True)
        self.listbox.bind("<<ListboxSelect>>", self.on_select)
        ttk.Button(left, text="+ Nouveau produit", command=self.new).pack(fill="x", pady=(8, 0))
        ttk.Button(left, text="Supprimer", command=self.delete).pack(fill="x", pady=4)

        f = ttk.Frame(self, padding=10); f.pack(side="left", fill="both", expand=True)
        f.columnconfigure(1, weight=1)
        self.v = {k: tk.StringVar() for k in ("name", "cat", "price", "size", "image")}
        self.stock = tk.BooleanVar(value=True)
        r = 0
        for label, key in (("Nom *", "name"), ("Catégorie", "cat"), ("Prix (DH) *", "price"), ("Format / poids", "size")):
            ttk.Label(f, text=label).grid(row=r, column=0, sticky="w", pady=4)
            w = ttk.Combobox(f, textvariable=self.v[key], values=CATS, state="readonly") if key == "cat" \
                else ttk.Entry(f, textvariable=self.v[key])
            w.grid(row=r, column=1, sticky="ew"); r += 1
        ttk.Label(f, text="Photo").grid(row=r, column=0, sticky="w")
        pf = ttk.Frame(f); pf.grid(row=r, column=1, sticky="ew"); pf.columnconfigure(0, weight=1)
        ttk.Entry(pf, textvariable=self.v["image"], state="readonly").grid(row=0, column=0, sticky="ew")
        ttk.Button(pf, text="Choisir…", command=self.pick_image).grid(row=0, column=1, padx=(6, 0)); r += 1
        ttk.Label(f, text="Description courte").grid(row=r, column=0, sticky="nw", pady=4)
        self.short = tk.Text(f, height=2, wrap="word"); self.short.grid(row=r, column=1, sticky="ew"); r += 1
        ttk.Label(f, text="Description").grid(row=r, column=0, sticky="nw", pady=4)
        self.desc = tk.Text(f, height=5, wrap="word"); self.desc.grid(row=r, column=1, sticky="ew"); r += 1
        ttk.Label(f, text="Bénéfices\n(un par ligne)").grid(row=r, column=0, sticky="nw", pady=4)
        self.benefits = tk.Text(f, height=5, wrap="word"); self.benefits.grid(row=r, column=1, sticky="ew"); r += 1
        ttk.Checkbutton(f, text="En stock", variable=self.stock).grid(row=r, column=1, sticky="w", pady=6); r += 1
        ttk.Label(f, text="Rappel : pas de promesse médicale ni de guérison.", foreground="#a33").grid(row=r, column=1, sticky="w"); r += 1
        ttk.Button(f, text="Enregistrer le produit", command=self.save_product).grid(row=r, column=1, sticky="e", pady=12)
        self.refresh(); self.new()

    def refresh(self):
        self.listbox.delete(0, "end")
        for p in self.products:
            self.listbox.insert("end", f"{p['name']} — {p['price']} DH")

    def clear(self):
        for var in self.v.values(): var.set("")
        for t in (self.short, self.desc, self.benefits): t.delete("1.0", "end")
        self.v["cat"].set(CATS[0]); self.stock.set(True); self.image_src = None

    def new(self):
        self.current = None; self.listbox.selection_clear(0, "end"); self.clear()

    def on_select(self, _):
        sel = self.listbox.curselection()
        if not sel: return
        self.current = sel[0]; p = self.products[self.current]; self.clear()
        for k in ("name", "cat", "size", "image"): self.v[k].set(p.get(k, ""))
        self.v["price"].set(str(p.get("price", "")))
        self.stock.set(p.get("stock", True))
        self.short.insert("1.0", p.get("short", "")); self.desc.insert("1.0", p.get("desc", ""))
        self.benefits.insert("1.0", "\n".join(p.get("benefits", [])))

    def pick_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        if path:
            self.image_src = path; self.v["image"].set(Path(path).name)

    def save_product(self):
        name = self.v["name"].get().strip()
        try:
            price = int(float(self.v["price"].get().replace(",", ".")))
        except ValueError:
            return messagebox.showerror("Erreur", "Le prix doit être un nombre (ex : 249).")
        if not name or price <= 0:
            return messagebox.showerror("Erreur", "Le nom et le prix sont obligatoires.")
        old = self.products[self.current] if self.current is not None else {}
        pid = old.get("id") or slugify(name)
        if self.current is None and any(p["id"] == pid for p in self.products):
            pid += "-" + str(len(self.products) + 1)
        image = old.get("image", "")
        if self.image_src:  # copie la photo dans images/
            IMAGES.mkdir(exist_ok=True)
            dest = IMAGES / f"{pid}{Path(self.image_src).suffix.lower()}"
            shutil.copy(self.image_src, dest); image = f"images/{dest.name}"
        p = {"id": pid, "name": name, "cat": self.v["cat"].get(), "price": price,
             "size": self.v["size"].get().strip(), "image": image, "stock": self.stock.get(),
             "short": self.short.get("1.0", "end").strip(), "desc": self.desc.get("1.0", "end").strip(),
             "benefits": [b.strip() for b in self.benefits.get("1.0", "end").splitlines() if b.strip()]}
        if self.current is None: self.products.append(p)
        else: self.products[self.current] = p
        save(self.products); self.refresh()
        messagebox.showinfo("Enregistré", f"« {name} » est enregistré dans js/products.js.\nRechargez le site pour le voir.")
        self.new()

    def delete(self):
        if self.current is None: return
        p = self.products[self.current]
        if messagebox.askyesno("Supprimer", f"Supprimer « {p['name']} » ?"):
            del self.products[self.current]; save(self.products); self.refresh(); self.new()


if __name__ == "__main__":
    App().mainloop()
