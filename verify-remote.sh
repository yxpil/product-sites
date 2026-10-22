#!/bin/sh
# Author: yxpil (scratch, runs on the production edge) — verifies the product vhosts at the origin.
# Reads /root/hosts.txt lines: <host>\t<hasRelease 0|1>\t<repo>
docs=0; dls=0; probs=0
while IFS='	' read -r h rel repo; do
  [ -z "$h" ] && continue
  st=$(curl -sk -o /dev/null -D /tmp/h1.txt -w '%{http_code}' --max-time 10 --resolve "$h:443:127.0.0.1" "https://$h/docs")
  loc=$(grep -i '^location:' /tmp/h1.txt | tr -d '\r' | cut -d' ' -f2)
  case "$loc" in
    "https://github.com/yxpil/$repo/blob/"*README.md) [ "$st" = "302" ] && docs=$((docs+1)) || { echo "DOCS STATUS $h $st"; probs=$((probs+1)); } ;;
    *) echo "DOCS BAD $h $st $loc"; probs=$((probs+1)) ;;
  esac
  if [ "$rel" = "1" ]; then
    st2=$(curl -sk -o /dev/null -D /tmp/h3.txt -w '%{http_code}' --max-time 10 --resolve "$h:443:127.0.0.1" "https://$h/download")
    loc2=$(grep -i '^location:' /tmp/h3.txt | tr -d '\r' | cut -d' ' -f2)
    if [ "$st2" = "302" ] && [ "$loc2" = "https://github.com/yxpil/$repo/releases/latest" ]; then
      dls=$((dls+1))
    else
      echo "DOWNLOAD BAD $h $st2 $loc2"; probs=$((probs+1))
    fi
  else
    st3=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$h:443:127.0.0.1" "https://$h/download")
    [ "$st3" = "404" ] || { echo "NO-RELEASE /download should be 404: $h $st3"; probs=$((probs+1)); }
  fi
done < /root/hosts.txt
echo "DOCS_OK=$docs DOWNLOAD_OK=$dls PROBLEMS=$probs"
