#!/bin/bash
# Pool Mining Script cho DERO
# Nhớ chmod +x pool_mining.sh để chạy

while :;  do
  ./astrominer \
    -w deroi1qyrt547ydu5xl2wq2jpct9wv2ujeapurczv66rdh39w70n3m82kfuq9pvfz92xcqqqqe3fpsdwgqw8x68y \        # Địa chỉ ví DERO của bạn
    -r community-pools.mysrv.cloud:10300 \  # Địa chỉ & port của pool
    -p wss                          # Protocol WSS cho pool mining
  sleep 5
done
