#!/bin/bash

# Programa creado para facilitar el testeo en localhost
# Todos los archivos de la pagina web se copia automaticamente a /srv/http
# Recuerda inicial el servicio: "sudo systemctl restart httpd"
# Ejecuta este script como admin (sudo)

# Directorio de destino

DEST_DIR="/srv/http"

# Copiar todos los archivos al directorio de destino

for file in *; do
  if [ -f "$file" ]; then
    sudo cp "$file" "$DEST_DIR"
  fi
done

echo "Todos los archivos han sido copiados a $DEST_DIR"
