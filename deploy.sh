#!/bin/bash

# 🚀 Azure Container Registry部署脚本
set -e

# 📋 配置变量
RESOURCE_GROUP="uxtester-platform_group"
ACR_NAME="aiuxtesteracr"
APP_SERVICE_NAME="uxtester-platform"
IMAGE_NAME="ai-simulator"
IMAGE_TAG="${1:-$(date +%Y%m%d-%H%M%S)}"

echo "🔧 配置信息:"
echo "  资源组: $RESOURCE_GROUP"
echo "  ACR名称: $ACR_NAME"
echo "  应用名称: $APP_SERVICE_NAME"
echo "  镜像标签: $IMAGE_TAG"
echo ""

# 检查Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI未安装，请先安装Azure CLI"
    exit 1
fi

# 检查登录状态
if ! az account show &> /dev/null; then
    echo "❌ 未登录Azure，请运行: az login"
    exit 1
fi

echo "🏗️ 构建Docker镜像..."
docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG .
docker tag $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:latest

echo "🔐 登录Azure Container Registry..."
az acr login --name $ACR_NAME

echo "📤 推送镜像到ACR..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:latest

echo "🔧 更新App Service配置..."
az webapp config container set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --docker-custom-image-name $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io

echo "♻️ 重启应用..."
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME

echo "⏳ 等待应用启动..."
sleep 30

echo "🩺 健康检查..."
HEALTH_URL="https://$APP_SERVICE_NAME.azurewebsites.net/api/health"
for i in {1..10}; do
    echo "尝试 $i/10: $HEALTH_URL"
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "✅ 健康检查通过!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ 健康检查失败，请检查应用日志"
        exit 1
    fi
    sleep 10
done

echo ""
echo "✅ 部署完成！"
echo "🌐 应用URL: https://$APP_SERVICE_NAME.azurewebsites.net"
echo "🩺 健康检查: $HEALTH_URL"
echo "📊 容器日志: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME"