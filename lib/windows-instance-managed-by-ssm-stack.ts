import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface WindowsInstanceManagedBySsmStackProps extends cdk.StackProps {
    vpcId: string;
    //subnetId: string;
    //availabilityZone: string;
    keyPairName: string;
}

export class WindowsInstanceManagedBySsmStack extends cdk.Stack {
    constructor(
        scope: Construct,
        id: string,
        props: WindowsInstanceManagedBySsmStackProps
    ) {
        super(scope, id, props);

        // 既存のVPCを参照
        const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
            isDefault: false,
            vpcId: props.vpcId,
        });
        // // 既存のサブネットを参照
        // const subnet = ec2.Subnet.fromSubnetAttributes(this, 'ExistingSubnet', {
        //     subnetId: props.subnetId,
        //     availabilityZone: props.availabilityZone,
        // });

        // // IAMロールを作成（SSM Agent用のポリシーを含む）
        // const role = new iam.Role(this, 'WindowsEC2SSMRole', {
        //     assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        // });
        //
        // // 必要なポリシーをIAMロールにアタッチ
        // role.addManagedPolicy(
        //     iam.ManagedPolicy.fromAwsManagedPolicyName(
        //         'AmazonSSMManagedInstanceCore'
        //     )
        // );

        // セキュリティグループを作成
        const securityGroup = new ec2.SecurityGroup(
            this,
            'WindowsEC2SecurityGroup',
            {
                vpc,
                allowAllOutbound: true,
                description: 'Allow traffic for Fleet Manager',
            }
        );

        // 必要ならインバウンドルールを追加
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.RDP,
            'Allow RDP access'
        );

        // EC2インスタンスの作成
        const instance = new ec2.Instance(this, 'WindowsEC2Instance', {
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machineImage: new ec2.GenericWindowsImage({
                'ap-northeast-1': 'ami-01e71250f518af3d3',
            }),
            role: new iam.Role(this, 'WindowsEC2SSMRole', {
                assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName(
                        'AmazonSSMManagedInstanceCore'
                    ),
                ],
            }),
            securityGroup: securityGroup,
            associatePublicIpAddress: false,
            keyPair: ec2.KeyPair.fromKeyPairName(
                this,
                'ExistingKeyPair',
                props.keyPairName
            ),
        });

        // VPCエンドポイントを作成
        vpc.addInterfaceEndpoint('ssm', {
            service: ec2.InterfaceVpcEndpointAwsService.SSM,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            privateDnsEnabled: false,
        });
        vpc.addInterfaceEndpoint('ssmmessages', {
            service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            privateDnsEnabled: false,
        });
        vpc.addInterfaceEndpoint('ec2messages', {
            service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            privateDnsEnabled: false,
        });

        // // 出力: インスタンスIDとパブリックDNS（デバッグ用）
        // new cdk.CfnOutput(this, 'InstanceID', {
        //     value: instance.instanceId,
        // });
        //
        // new cdk.CfnOutput(this, 'InstancePublicDNS', {
        //     value: instance.instancePublicDnsName,
        // });
    }
}
