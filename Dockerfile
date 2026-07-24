FROM langgenius/dify-api:1.16.0
COPY api/libs/token.py /app/api/libs/token.py
COPY api/libs/device_flow_security.py /app/api/libs/device_flow_security.py
COPY api/app_factory.py /app/api/app_factory.py
EXPOSE 10000
ENV PORT=10000
